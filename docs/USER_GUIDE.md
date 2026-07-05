# KernelSense User Guide

Welcome to KernelSense! This guide will help you interpret the dashboard and understand what each module is telling you about your system.

## 1. Setting Your Clearance Level
When you first load KernelSense (`http://localhost:3000`), you will be prompted to select an **Access Level**. KernelSense does not require a password; it operates on an honor-system clearance model designed for localized, single-tenant use.
- Select **Guest** if you just want a generic overview of system health.
- Select **Kernel** to see everything, including deep file descriptors and sockets.

*Note: You can change this at any time using the selector in the top-right of the dashboard.*

## 2. The Dashboard Views

### System Health Dashboard
The master view. This aggregates all active "Incidents" predicted by the AI. If the system is healthy, it will be quiet. If there is a memory leak, a `Ring 0` critical alert will appear with an LLM-generated root-cause diagnostic.

### Process Genealogy
This view shows a directed graph of all running processes.
- **Lines** represent Parent-Child relationships.
- **Node Size** maps to memory footprint.
- **Clicking a Node** opens the Detail Drawer. (Requires **Kernel** clearance to view open files and network sockets).

### Memory Intelligence
Watch the blocks compress as memory fills up. The line charts below the blocks track anomalous heap growth. If a line turns red, the LSTM model has predicted it will crash the system within 5 minutes.

### CPU Scheduler Stream
A live, cascading visualization of context switches. Rather than rendering every single CPU event, this visualizer bins them so you can see "waves" of execution pressure across your 16 (or however many) logical cores.
