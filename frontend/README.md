# College Media Frontend

This is the frontend application for College Media, a social media platform for college students.

## Tech Stack

- React 19
- Vite
- Material-UI
- Tailwind CSS
- React Router DOM
- Lucide React Icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Project Structure

The frontend follows a modular folder structure designed for scalability and maintainability:

```
frontend/
├── public/                    # Static assets served directly
├── src/
│   ├── assets/               # Imported assets (images, icons, etc.)
│   ├── components/           # Reusable UI components
│   │   ├── chatbot/          # Chatbot-related components
│   │   │   ├── ChatBody.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatbotWidget.jsx
│   │   │   └── chat.service.js
│   │   ├── About.jsx         # About section component
│   │   ├── CTA.jsx           # Call-to-Action component
│   │   ├── Features.jsx      # Features section component
│   │   ├── Footer.jsx        # Site footer component
│   │   ├── Hero.jsx          # Hero section component
│   │   ├── Navbar.jsx        # Navigation bar component
│   │   └── Team.jsx          # Team section component
│   ├── context/              # React Context providers for global state
│   │   ├── AuthContext.jsx   # Authentication state management
│   │   ├── ChatContext.jsx   # Chatbot state management
│   │   └── useChat.js        # Chat-related utilities
│   ├── hooks/                # Custom React hooks
│   │   └── useChatbot.js     # Chatbot functionality hook
│   ├── pages/                # Page-level components (routes)
│   │   ├── Home.jsx          # Landing page
│   │   ├── Login.jsx         # User login page
│   │   └── Signup.jsx        # User registration page
│   ├── styles/               # CSS stylesheets
│   │   ├── main.css          # Main application styles
│   │   └── chatbot.css       # Chatbot-specific styles
│   ├── App.jsx               # Main application component with routing
│   ├── index.css             # Global CSS imports
│   └── main.jsx              # Application entry point
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── eslint.config.js          # ESLint configuration
```

### Folder Hierarchy Explanation

- **`public/`**: Contains static assets that are served directly by the web server. Files here are accessible at the root URL (e.g., `/favicon.ico`).

- **`src/assets/`**: For assets that are imported into components (e.g., images, fonts). These are processed by the build system.

- **`src/components/`**: Reusable UI components. Organized by feature (e.g., `chatbot/` subdirectory for related components).
  - Components should be self-contained and reusable across different pages.
  - Use PascalCase for component file names (e.g., `Hero.jsx`).

- **`src/context/`**: React Context providers for global state management.
  - `AuthContext.jsx`: Manages user authentication state (login, logout, token storage).
  - `ChatContext.jsx`: Manages chatbot conversation state and messages.

- **`src/hooks/`**: Custom React hooks for reusable logic.
  - `useChatbot.js`: Encapsulates chatbot functionality and API calls.

- **`src/pages/`**: Top-level page components that correspond to routes.
  - Each page represents a full screen/view in the application.
  - Pages typically compose multiple components together.

- **`src/styles/`**: CSS files for styling.
  - `main.css`: Global styles and utility classes.
  - Component-specific styles (e.g., `chatbot.css` for chatbot components).

## Major Components and Pages

### Pages

- **`Home.jsx`**: The main landing page featuring all marketing sections (Hero, Features, About, Team, CTA, Footer). Acts as a single-page application landing experience.

- **`Login.jsx`**: User authentication page for existing users to sign in.

- **`Signup.jsx`**: User registration page for new users to create accounts.

### Components

#### Layout Components
- **`Navbar.jsx`**: Site navigation bar with links and branding.
- **`Footer.jsx`**: Site footer with links, copyright, and additional information.

#### Landing Page Sections
- **`Hero.jsx`**: Main hero section with headline, description, and primary call-to-action buttons.
- **`Features.jsx`**: Showcases key features of the platform.
- **`About.jsx`**: Provides information about the company/platform.
- **`Team.jsx`**: Displays team member information.
- **`CTA.jsx`**: Call-to-action section encouraging user engagement.

#### Chatbot Components
- **`ChatbotWidget.jsx`**: Main floating chatbot widget that appears globally across the app.
- **`ChatHeader.jsx`**: Header of the chatbot with title and close button.
- **`ChatBody.jsx`**: Main chat interface displaying conversation messages.
- **`ChatInput.jsx`**: Input field for users to type messages to the chatbot.

### Context Providers

- **`AuthContext`**: Provides authentication state and methods throughout the app.
  - Manages user login status, token storage, and user data.
  - Used for protecting routes and displaying user-specific content.

- **`ChatContext`**: Manages chatbot conversation state.
  - Handles message history, loading states, and chat interactions.

## Best Practices for Adding New Components

### 1. Component Organization
- **Location**: Place reusable components in `src/components/`. Create subdirectories for feature-specific components (e.g., `chatbot/`, `auth/`).
- **Naming**: Use PascalCase for component files (e.g., `UserProfile.jsx`). Keep names descriptive and concise.
- **File Structure**: Each component should be in its own file. If a component has multiple related files, group them in a subdirectory.

### 2. Component Design Principles
- **Single Responsibility**: Each component should have one clear purpose.
- **Reusability**: Design components to be reusable across different contexts.
- **Props Interface**: Clearly define and document the props interface. Use PropTypes or TypeScript for type safety.
- **Styling**: Use Tailwind CSS classes for styling. Keep component-specific styles in `src/styles/` if needed.

### 3. State Management
- **Local State**: Use `useState` for component-specific state.
- **Global State**: Use Context providers for app-wide state (authentication, user data).
- **Custom Hooks**: Extract complex logic into custom hooks in `src/hooks/`.

### 4. Adding New Pages
- Create the page component in `src/pages/`.
- Add the route in `App.jsx` using React Router.
- Ensure the page follows the established layout patterns.

### 5. File and Folder Naming Conventions
- **Components**: PascalCase (e.g., `UserCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`)
- **Context**: PascalCase with `Context` suffix (e.g., `AuthContext.jsx`)
- **Utilities**: camelCase (e.g., `apiHelpers.js`)
- **Styles**: kebab-case (e.g., `user-card.css`)

### 6. Code Quality
- Follow ESLint rules defined in `eslint.config.js`.
- Write meaningful commit messages.
- Add comments for complex logic.
- Test components manually and ensure they work across different screen sizes.

### 7. Adding New Features
1. Identify if it's a new page, component, or feature enhancement.
2. Plan the component hierarchy and data flow.
3. Implement the component following the above guidelines.
4. Update this documentation if the structure changes.
5. Test thoroughly and ensure responsive design.

### 8. Import/Export Patterns
- Use named exports for components: `export default function MyComponent()`
- Import components with clear, descriptive names: `import MyComponent from './MyComponent'`
- Group related imports (React, third-party libraries, internal components)

By following these guidelines, developers can maintain a clean, scalable, and maintainable codebase that grows effectively with new features.
