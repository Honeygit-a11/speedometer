# Speed Test Feature Architecture

This directory encapsulates all domain logic and presentation for the speed testing system.

```
features/
└── speed-test/
    ├── engine/             # (Phase 3) Headless measurement logic (no React dependencies)
    │   ├── ping.ts         # Latency & ping sampling
    │   ├── jitter.ts       # Statistical jitter calculation
    │   ├── download.ts     # Progressive chunk streaming & dynamic concurrency
    │   ├── upload.ts       # Synthetic browser payload generation & upload sink
    │   ├── calculations.ts # Bitrate, sample aggregation, and smoothing formulas
    │   └── test-controller.ts # State machine (IDLE -> INITIALIZING -> PING -> DOWNLOAD -> UPLOAD -> RESULTS)
    │
    └── components/         # (Phase 4) React UI presentation
        ├── SpeedMeter.tsx  # Gauge/speedometer visualizer (Mbps/Gbps readout)
        ├── MetricCard.tsx  # Ping, Jitter, Download, Upload cards
        ├── Results.tsx     # Completed test overview
        └── TestControls.tsx# Start / Cancel / Retry actions
```
