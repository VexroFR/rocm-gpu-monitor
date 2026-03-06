A simple and efficient GNOME Shell extension that displays your AMD GPU statistics directly in the top bar.

Features:

  - GPU Load: Real-time utilization percentage.

  - VRAM Usage: Current memory usage displayed in GB (e.g., 2.4/8.0Go).

  - Lightweight: Updates every 2 seconds using asynchronous calls to prevent UI lag.

Requirement: This extension requires the rocm-smi tool to be installed on your system. On Arch Linux, you can install it via the rocm-smi-lib package.

Note: Ensure your user has permissions to run rocm-smi (usually by being part of the 'render' or 'video' group).
