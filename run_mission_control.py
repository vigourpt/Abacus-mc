#!/usr/bin/env python3
"""Mission Control - Main Entry Point

Starts the orchestration loop to process tasks via OpenClaw.

Enhanced with:
- Run sessions for isolated execution tracking
- Scheduler with dependency resolution
- Agent capability-based routing
- Metrics collection and API

Usage:
    python run_mission_control.py
    python run_mission_control.py --config config.yaml
    python run_mission_control.py --use-scheduler  # Use new scheduler
    python run_mission_control.py --metrics-port 9090  # Enable metrics API
"""

import os
import sys
import signal
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

import yaml

from connectors.openclaw_client import OpenClawClient
from orchestration.task_runner import TaskRunner
from orchestration.logger import get_logger
from orchestration.run_sessions import create_run, get_session_manager, RunStatus
from orchestration.scheduler import Scheduler, get_scheduler
from orchestration.metrics import get_metrics_collector
from orchestration.capability_index import get_capability_index
from api.metrics_api import create_metrics_server


class MissionControl:
    """Main Mission Control orchestrator.
    
    Now supports:
    - Run sessions for tracking each execution
    - Scheduler with dependency resolution
    - Capability-based agent matching
    - Metrics collection and API exposure
    """
    
    def __init__(self, config_path: str = None, use_scheduler: bool = False, 
                 metrics_port: int = None):
        self.config = self._load_config(config_path)
        self.use_scheduler = use_scheduler
        self.metrics_port = metrics_port
        
        self.logger = get_logger(
            log_level=self.config.get('logging', {}).get('level', 'INFO'),
            console_output=self.config.get('logging', {}).get('console', True)
        )
        self.openclaw_client = None
        self.task_runner = None
        self.scheduler = None
        self.run_session = None
        self.metrics_server = None
        self._shutdown_requested = False
    
    def _load_config(self, config_path: str = None) -> dict:
        """Load configuration from YAML file."""
        if config_path is None:
            config_path = os.getenv('MC_CONFIG', 'config.yaml')
        
        config_file = Path(config_path)
        if config_file.exists():
            with open(config_file) as f:
                return yaml.safe_load(f) or {}
        
        # Return defaults if no config file
        return {
            'openclaw': {
                'endpoint': os.getenv('OPENCLAW_GATEWAY_HOST', 'http://localhost:8080'),
                'token': os.getenv('OPENCLAW_GATEWAY_TOKEN', ''),
                'timeout': 300,
                'retry_attempts': 3
            },
            'task_processing': {
                'max_concurrent': 5,
                'poll_interval': 2.0
            },
            'scheduler': {
                'enabled': False,
                'rate_limit': 0,  # Tasks per second (0 = unlimited)
                'poll_interval': 2.0
            },
            'metrics': {
                'enabled': True,
                'port': 9090
            },
            'logging': {
                'level': os.getenv('LOG_LEVEL', 'INFO'),
                'console': True
            },
            'paths': {
                'tasks_dir': 'tasks',
                'projects_dir': 'projects',
                'logs_dir': 'logs',
                'runs_dir': 'runs'
            }
        }
    
    def _setup_signal_handlers(self):
        """Setup graceful shutdown handlers."""
        def handle_shutdown(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            self._shutdown_requested = True
            self.shutdown()
        
        signal.signal(signal.SIGINT, handle_shutdown)
        signal.signal(signal.SIGTERM, handle_shutdown)
    
    def initialize(self):
        """Initialize all components."""
        self.logger.info("Initializing Mission Control...")
        
        # Create new run session
        self.run_session = create_run(config=self.config)
        self.logger.info(f"✓ Run session created: {self.run_session.run_id}")
        
        # Setup metrics collector with run directory
        metrics = get_metrics_collector()
        metrics.set_run_dir(str(self.run_session.run_dir))
        self.logger.info("✓ Metrics collector initialized")
        
        # Load agent capabilities
        cap_index = get_capability_index()
        cap_index.load_agents()
        cap_summary = cap_index.get_capability_summary()
        self.logger.info(f"✓ Loaded {cap_summary['total_agents']} agents into capability index")
        
        # Setup OpenClaw client
        oc_config = self.config.get('openclaw', {})
        self.openclaw_client = OpenClawClient(
            api_endpoint=oc_config.get('endpoint'),
            api_token=oc_config.get('token'),
            timeout=oc_config.get('timeout', 300),
            retry_attempts=oc_config.get('retry_attempts', 3)
        )
        
        # Check OpenClaw connection
        if self.openclaw_client.health_check():
            self.logger.info("✓ OpenClaw Gateway connected")
            self.run_session.log_event('openclaw_connected', {'endpoint': oc_config.get('endpoint')})
        else:
            self.logger.warning("⚠ OpenClaw Gateway not reachable - tasks will queue")
            self.run_session.log_event('openclaw_disconnected', {}, level="WARNING")
        
        # Setup task runner
        tp_config = self.config.get('task_processing', {})
        self.task_runner = TaskRunner(
            openclaw_client=self.openclaw_client,
            max_concurrent=tp_config.get('max_concurrent', 5),
            poll_interval=tp_config.get('poll_interval', 2.0)
        )
        self.logger.info("✓ Task runner initialized")
        
        # Setup scheduler if enabled
        sched_config = self.config.get('scheduler', {})
        if self.use_scheduler or sched_config.get('enabled', False):
            self.scheduler = get_scheduler()
            self.scheduler.set_task_runner(self.task_runner)
            self.scheduler.poll_interval = sched_config.get('poll_interval', 2.0)
            self.scheduler.max_concurrent = tp_config.get('max_concurrent', 5)
            self.scheduler.rate_limit = sched_config.get('rate_limit', 0)
            self.logger.info("✓ Scheduler initialized (dependency-aware)")
        
        # Start metrics API server
        metrics_config = self.config.get('metrics', {})
        port = self.metrics_port or metrics_config.get('port', 9090)
        if metrics_config.get('enabled', True) or self.metrics_port:
            self.metrics_server = create_metrics_server(port=port)
            self.metrics_server.start(blocking=False)
            self.logger.info(f"✓ Metrics API at http://localhost:{port}")
        
        self._setup_signal_handlers()
        self.run_session.log_event('initialization_complete', {
            'scheduler_enabled': self.scheduler is not None,
            'metrics_enabled': self.metrics_server is not None
        })
    
    def start(self):
        """Start Mission Control."""
        self.logger.info("="*50)
        self.logger.info("   MISSION CONTROL - STARTING")
        self.logger.info("="*50)
        self.logger.info(f"   Run ID: {self.run_session.run_id}")
        
        status = self.task_runner.get_status()
        self.logger.info(f"Backlog: {status['backlog_count']} tasks")
        self.logger.info(f"Running: {status['running_count']} tasks")
        self.logger.info(f"Max concurrent: {status['max_concurrent']}")
        
        if self.scheduler:
            self.logger.info("Mode: Scheduler (dependency-aware)")
        else:
            self.logger.info("Mode: Direct task runner")
        
        self.logger.info("="*50)
        
        self.run_session.log_event('mission_control_started', status)
        
        try:
            if self.scheduler:
                # Use scheduler for dependency-aware execution
                self.scheduler.start(blocking=True)
            else:
                # Use direct task runner (original behavior)
                self.task_runner.run_loop()
        except KeyboardInterrupt:
            self.logger.info("Keyboard interrupt received")
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Graceful shutdown."""
        self.logger.info("Shutting down Mission Control...")
        
        # Stop scheduler
        if self.scheduler:
            self.scheduler.stop()
        
        # Stop task runner
        if self.task_runner:
            self.task_runner.stop()
        
        # Stop metrics server
        if self.metrics_server:
            self.metrics_server.stop()
        
        # Finalize run session
        if self.run_session:
            metrics = get_metrics_collector()
            metrics.flush_to_disk()
            
            self.run_session.log_event('mission_control_stopped', {})
            self.run_session.set_status(RunStatus.COMPLETED)
            
            summary = self.run_session.get_summary()
            self.logger.info(f"Run summary: {summary['task_count']} tasks, "
                           f"{summary['completed_count']} completed, "
                           f"{summary['failed_count']} failed")
        
        self.logger.info("Mission Control stopped")


def main():
    parser = argparse.ArgumentParser(
        description='Mission Control - AI Agent Orchestration'
    )
    parser.add_argument(
        '--config', '-c',
        default='config.yaml',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Initialize and show status without running'
    )
    parser.add_argument(
        '--use-scheduler',
        action='store_true',
        help='Use scheduler with dependency resolution'
    )
    parser.add_argument(
        '--metrics-port',
        type=int,
        default=None,
        help='Port for metrics API (enables metrics server)'
    )
    parser.add_argument(
        '--list-agents',
        action='store_true',
        help='List indexed agents and exit'
    )
    args = parser.parse_args()
    
    # List agents mode
    if args.list_agents:
        cap_index = get_capability_index()
        cap_index.load_agents()
        summary = cap_index.get_capability_summary()
        print(f"\nIndexed Agents: {summary['total_agents']}")
        print(f"Capabilities: {summary['total_capabilities']}")
        print("\nBy Division:")
        for div, count in summary['agents_by_division'].items():
            print(f"  {div}: {count}")
        return
    
    mc = MissionControl(
        config_path=args.config,
        use_scheduler=args.use_scheduler,
        metrics_port=args.metrics_port
    )
    mc.initialize()
    
    if args.dry_run:
        status = mc.task_runner.get_status()
        print("\nMission Control Status:")
        print(f"  Run ID: {mc.run_session.run_id}")
        print(f"  OpenClaw Connected: {status['openclaw_connected']}")
        print(f"  Backlog Tasks: {status['backlog_count']}")
        print(f"  Running Tasks: {status['running_count']}")
        print(f"  Max Concurrent: {status['max_concurrent']}")
        print(f"  Scheduler Mode: {mc.scheduler is not None}")
        if mc.metrics_server:
            print(f"  Metrics API: {mc.metrics_server.get_url()}")
    else:
        mc.start()


if __name__ == '__main__':
    main()
