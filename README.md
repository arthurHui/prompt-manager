
# Prompt Manager

A modern web application for managing AI prompts with user authentication, image uploads, and advanced search functionality.

## 🚀 Features

- **User Authentication** - Secure login/signup with Clerk
- **Prompt Management** - Create, edit, delete, and organize prompts
- **Image Uploads** - Cloudinary integration for prompt images
- **Advanced Search** - Search by title, filter by tags and categories
- **Prompt Combination** - Mix and match character, background, and pose prompts
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Notifications** - Toast notifications for user feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **Database**: MongoDB with Mongoose
- **Image Storage**: Cloudinary
- **Notifications**: React Toastify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.0 or higher
- npm or yarn package manager
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd prompt-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Set up Required Services

#### MongoDB Setup
1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/)
2. Create a new cluster
3. Get your connection string and add it to `MONGODB_URI`

#### Clerk Authentication Setup
1. Create a Clerk account at [clerk.com](https://clerk.com/)
2. Create a new application
3. Get your publishable key and secret key
4. Add them to your environment variables

#### Cloudinary Setup (Optional - for image uploads)
1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Add them to your environment variables

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📱 Application Features

### Authentication
- User registration and login
- Protected routes that redirect to sign-in
- User profile management

### Prompt Management
- **Create Prompts**: Add new prompts with title, description, category, tags, and images
- **Edit Prompts**: Update existing prompts
- **Delete Prompts**: Remove prompts you no longer need
- **Categories**: Organize prompts by Character, Background, or Pose

### Search & Filtering
- **Search by Title**: Find prompts by name
- **Filter by Tags**: Use tags to categorize and find related prompts
- **Filter by Category**: View prompts by type (Character, Background, Pose)
- **Real-time Search**: Database-driven search with Enter key or search button

### Prompt Combination
- **Mix and Match**: Combine different types of prompts
- **Live Preview**: See the combined result in real-time
- **Copy to Clipboard**: Easy copying of combined prompts

## 🏗️ Project Structure

```
prompt-manager/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Home page (prompt listing)
│   │   ├── create/          # Create/edit prompt page
│   │   ├── combine/         # Prompt combination page
│   │   ├── sign-in/         # Authentication pages
│   │   ├── sign-up/
│   │   └── api/             # API routes
│   │       ├── prompts/     # Prompt CRUD operations
│   │       └── tags/        # Tag management
│   ├── lib/                 # Utility functions
│   │   └── mongodb.ts       # Database connection
│   └── models/              # Database models
│       └── Prompt.ts        # Prompt schema
├── public/                  # Static assets
├── .env.local              # Environment variables (create this)
├── package.json
└── README.md
```

## 🚀 Deployment

### Deploy on Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Other Deployment Options
- **Netlify**: Alternative hosting platform
- **Railway**: Full-stack deployment
- **DigitalOcean App Platform**: Cloud hosting

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🔧 Configuration

### Database Schema
The application uses the following main collections:
- **prompts**: Stores all prompt data with categories, tags, and metadata

### API Routes
- `GET /api/prompts` - Fetch prompts with optional search and filtering
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/[id]` - Update existing prompt
- `DELETE /api/prompts/[id]` - Delete prompt
- `GET /api/tags` - Fetch all available tags

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure your MongoDB cluster is running

**"Clerk authentication not working"**
- Verify your Clerk keys are correct
- Check if your domain is added to Clerk dashboard
- Ensure you're using the correct environment (development/production)

**"Image uploads failing"**
- Verify your Cloudinary credentials
- Check your Cloudinary upload settings
- Ensure your API keys have proper permissions

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Check the network tab for failed API requests
4. Review the terminal output for server errors

## 📞 Support

For questions and support, please [open an issue](https://github.com/your-username/prompt-manager/issues) on GitHub.

---

Built with ❤️ using Next.js, MongoDB, and Clerk
