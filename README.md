# 🏆 Tender Allotment

> A modern React Native mobile application for tender and allotment management built with Expo

![Expo](https://img.shields.io/badge/Expo-52.0-blue?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76-green?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ Features

🎯 **Smart Tender Management** - Efficiently manage and track tender processes
📊 **Data Analysis** - Built-in analytics and reporting capabilities
📱 **Cross-Platform** - Works seamlessly on iOS, Android, and Web
🔄 **CSV Support** - Import and export data with PapaParse
💾 **Local Storage** - Persistent data storage with MMKV
🎨 **Beautiful UI** - Responsive design with blur effects and smooth animations
📂 **File Management** - Document handling and sharing capabilities
🔔 **Haptic Feedback** - Interactive haptic responses for better UX
🌐 **Multi-language Ready** - Scalable for internationalization

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI

### Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/tender-allotment.git
cd tender-allotment

# 2️⃣ Install dependencies
npm install
# or
yarn install

# 3️⃣ Start the development server
npm start
# or
yarn start
```

### Running the App

After starting the development server, choose your preferred platform:

```bash
# 📱 iOS Simulator
i

# 🤖 Android Emulator
a

# 🌐 Web Browser
w

# 📦 Expo Go (requires Expo Go app on phone)
j
```

---

## 📚 Project Structure

```
tender-allotment/
├── 📁 app/                    # Main app code (file-based routing)
│   ├── 📁 (tabs)/            # Tab-based navigation
│   └── 📁 screens/           # App screens
├── 📁 components/            # Reusable React components
├── 📁 context/               # React Context for state management
├── 📁 types/                 # TypeScript type definitions
├── 📁 utils/                 # Utility functions
├── 📁 assets/                # Images, fonts, and static assets
├── 📱 app.json              # Expo configuration
├── 📋 package.json          # Dependencies and scripts
└── 🔧 tsconfig.json         # TypeScript configuration
```

---

## 🛠️ Available Scripts

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `npm start`             | 🚀 Start development server       |
| `npm run android`       | 🤖 Run on Android device/emulator |
| `npm run ios`           | 📱 Run on iOS simulator           |
| `npm run web`           | 🌐 Run in web browser             |
| `npm test`              | 🧪 Run test suite with Jest       |
| `npm run lint`          | ✅ Run Expo linter                |
| `npm run reset-project` | 🔄 Reset to blank project         |

---

## 📦 Key Dependencies

### UI & Navigation

- **expo-router** - File-based routing
- **@react-navigation** - Navigation framework
- **@shopify/flash-list** - High-performance list component
- **react-native-gesture-handler** - Gesture recognition

### Data & Storage

- **react-native-mmkv** - High-performance key-value storage
- **@react-native-async-storage** - AsyncStorage alternative
- **papaparse** - CSV data parsing

### Device Features

- **expo-media-library** - Access device photos & media
- **expo-document-picker** - File picking
- **expo-file-system** - File system access
- **expo-print** - Print documents
- **expo-sharing** - Share content
- **expo-haptics** - Haptic feedback
- **react-native-permissions** - Permission handling

### UI Components

- **@expo/vector-icons** - Icon library
- **expo-blur** - Blur effects
- **react-native-modal** - Modal dialogs
- **react-native-dropdown-picker** - Dropdown selectors
- **react-native-element-dropdown** - Advanced dropdowns
- **react-native-svg** - SVG rendering

---

## 🎯 Development Workflow

### 1. Edit Files

Make changes in the `app/` directory with hot reload enabled.

### 2. Use File-Based Routing

This project uses Expo Router for automatic routing based on file structure.

```
app/
├── (tabs)/
│   ├── _layout.tsx       # Tab layout
│   ├── index.tsx         # Home tab
│   └── explore.tsx       # Explore tab
└── +not-found.tsx        # 404 page
```

### 3. TypeScript Support

Full TypeScript support with strict type checking:

```typescript
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View>
      <Text>Hello World 👋</Text>
    </View>
  );
}
```

---

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --no-watchAll
```

Tests use Jest with the jest-expo preset.

---

## 📄 Configuration

### Expo Configuration (`app.json`)

- App name, version, and orientation
- iOS bundle identifier and Android package name
- Permissions configuration
- Splash screen and app icon setup
- Plugins and experiments enabled

### TypeScript Configuration (`tsconfig.json`)

- Strict type checking enabled
- Path aliases configured
- React Native/Expo types included

---

## 🔐 Permissions

The app requires these permissions on Android:

- 📸 `READ_MEDIA_IMAGES` - Access to device photos
- 📝 `WRITE_EXTERNAL_STORAGE` - Write to external storage
- 📖 `READ_EXTERNAL_STORAGE` - Read from external storage
- 💾 `MANAGE_EXTERNAL_STORAGE` - Manage all files

iOS permissions are handled automatically via Expo.

---

## 🌐 Web Support

The app supports web deployment:

```bash
npm run web
```

Uses Metro bundler with static output for hosting on any web server.

---

## 📚 Learning Resources

- 🔗 [Expo Documentation](https://docs.expo.dev/)
- 📖 [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- 🎓 [React Native Docs](https://reactnative.dev/)
- 🚀 [Getting Started Tutorial](https://docs.expo.dev/tutorial/introduction/)
- 💬 [Expo Discord Community](https://chat.expo.dev)

---

## 🤝 Contributing

Contributions are welcome! 🎉

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💬 Feedback & Support

Have questions or suggestions?

- 📧 Reach out via GitHub issues
- 💭 Join our community discussions
- 🐛 Report bugs with detailed information
- 💡 Suggest new features

---

<div align="center">

### O❤️S

</div>
