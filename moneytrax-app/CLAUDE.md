# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoneyTrax is a React-based financial visualization application that displays animated money flows between income/expense sources and accounts. Built with React 19, TypeScript, and Vite.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Components

The app follows a component-based architecture with three main visualization components:

- **Source.tsx**: Renders income/expense sources as circular nodes on the left side
- **Account.tsx**: Renders financial accounts as rectangular cards on the right side  
- **AnimatedStream.tsx**: Creates animated SVG paths showing money flow between sources and accounts

### Data Flow

1. **App.tsx** manages all state (sources, accounts, streams)
2. Sources and accounts are positioned algorithmically based on canvas dimensions
3. Streams connect sources to accounts with animated particles moving along SVG paths
4. Each stream has an `active` flag controlling its animation state

### Type System

All types are defined in `src/types/index.ts`:
- `Source`: Income/expense sources with amount and type
- `Account`: Financial accounts with balance and optional type
- `Stream`: Connections between sources and accounts with amount and active state

### State Management

Currently uses React's useState for all state management. No external state libraries.

## Key Implementation Details

### Positioning Algorithm
- Sources are positioned vertically on the left (15% from left edge)
- Accounts are positioned vertically on the right (85% from left edge)
- Both use equal spacing calculated from canvas height

### Animation System
- Uses CSS animations for particle movement along SVG paths
- Stream opacity indicates active/inactive state
- Animation duration is 3 seconds per cycle

### Styling Approach
- Component-specific styles in App.css
- Global styles and resets in index.css
- No CSS-in-JS or styled-components

## TypeScript Configuration

- Strict mode enabled
- Target: ES2022
- Module: ESNext with bundler resolution
- React JSX transform

## Current Limitations

- No testing infrastructure
- No API integration (all data is hardcoded)
- No persistence layer
- No routing (single page only)
- No error boundaries or error handling
- No accessibility features implemented