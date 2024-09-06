# Audio Configuration Test

This project is a React-based web application that allows users to test and
configure audio settings using the Web Audio API. It provides an interactive
interface for playing audio with adjustable volume and stereo panning.

## Features

- Play audio tones with left, center, and right panning
- Adjustable volume control
- Custom pan slider for precise stereo positioning
- Continuous play mode
- Responsive design for various screen sizes

## Technologies Used

- React
- TypeScript
- Web Audio API
- CSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

## Usage

The main application component is located in `src/App.tsx`. Key functionalities
include:

- `playSound`: Handles playing audio with specified frequency and panning
- `stopSound`: Stops the currently playing sound
- `handlePanChange`: Updates the stereo panning in real-time
