# Mushroom Identifier App

A React Native application that helps users identify mushrooms through photos, providing detailed information about species, edibility, and safety warnings.

## Features

- Photo-based mushroom identification
- Detailed species information
- Edibility and toxicity warnings
- Personal collection of identified mushrooms
- Educational content about mushrooms
- User authentication and data persistence

## Tech Stack

- React Native with TypeScript
- Expo
- Firebase (Authentication, Firestore, Storage)
- React Navigation
- TensorFlow.js (for mushroom identification)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mushroom-identifier
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up Firebase:
   - Create a new Firebase project
   - Add your Firebase configuration to `src/config/firebase.ts`
   - Enable Authentication, Firestore, and Storage in Firebase Console

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and Firebase services
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── config/         # Configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This app is for informational purposes only. Always consult with experts before consuming any wild mushrooms. The app's identification features should not be solely relied upon for determining edibility. # Mushroom
