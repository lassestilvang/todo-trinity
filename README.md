# Todo Trinity

A daily task planner application built with Next.js 16, TypeScript, and modern web technologies.

## Features

- **Task Management**: Create, edit, and organize daily tasks
- **Priority System**: Set task priorities (Low, Medium, High, Urgent)
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Animations**: Smooth transitions with Framer Motion
- **Authentication**: Secure user authentication with NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **API Routes**: RESTful API for task management

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Testing**: Jest and React Testing Library

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/todo-trinity.git
cd todo-trinity
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database connection in `.env.local`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/todo-trinity"
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
todo-trinity/
├── app/
│   ├── api/           # API routes
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page
├── components/        # React components
├── lib/              # Utility functions
├── prisma/           # Database schema and migrations
├── public/           # Static assets
└── styles/           # CSS files
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Database

The application uses PostgreSQL with Prisma ORM. To manage the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## Authentication

The application uses NextAuth.js for authentication. Configure providers in `lib/auth.ts`.

## Testing

Run tests with:
```bash
npm run test
```

## Deployment

This application can be deployed to any platform that supports Node.js and PostgreSQL, such as:
- Vercel
- Netlify
- Railway
- Heroku

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.