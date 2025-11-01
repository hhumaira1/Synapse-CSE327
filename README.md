# SynapseCRM

* [ ] 

> **AI-Powered CRM Platform** - A modern, full-stack Customer Relationship Management system built with the latest technologies for 2025.

## 🌟 Overview

SynapseCRM is a comprehensive, multi-tenant CRM platform designed to streamline business operations with AI-powered insights. Built with a modern monorepo architecture featuring Next.js 16 frontend and NestJS 11 backend, it offers seamless contact management, lead tracking, deal pipeline management, and integrated communication tools.

## ✨ Key Features

### 🎯 Core CRM Functionality

- [ ] **Contact Management** - Centralized customer database with detailed profiles
- [ ] **Lead Tracking** - Automated lead scoring and nurturing workflows
- [ ] **Deal Pipeline** - Visual sales pipeline with customizable stages
- [ ] **Ticket Management** - Integrated customer support system
- [ ] **Interaction History** - Complete communication timeline per contact

### 🔐 Authentication & Security

- **Clerk Authentication** - Secure user management with JWT tokens
- **Multi-Tenant Architecture** - Complete data isolation between organizations
- **Role-Based Access Control** - Admin, Manager, and Member permissions
- **Session Management** - Secure token-based authentication

### 🎨 Modern UI/UX

- **Responsive Design** - Mobile-first approach with Tailwind CSS 4
- **Component Library** - shadcn/ui components with consistent design system
- **Dark/Light Mode** - User preference-based theming
- **Accessibility** - WCAG compliant interface components

### 🔌 Integration Ready

- **Gmail Integration** - Email synchronization and management
- **VoIP Support** - Call logging and communication tracking
- **External APIs** - RESTful API for third-party integrations
- **Webhook Support** - Real-time event notifications

## 🏗️ Architecture

### Monorepo Structure

```
synapse/
├── Frontend/           # Next.js 16 Application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── layout/    # Layout components (Navbar, Footer)
│   │   │   └── landing/   # Landing page sections
│   │   └── lib/           # Utilities and configurations
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── server/             # NestJS 11 API Backend
│   ├── src/
│   │   ├── auth/          # Authentication modules
│   │   ├── clerk/         # Clerk integration
│   │   ├── database/      # Prisma database service
│   │   ├── common/        # Shared utilities
│   │   └── main.ts        # Application entry point
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── generated/     # Prisma client
│   └── package.json       # Backend dependencies
│
├── .github/            # GitHub configurations
├── synapse-crm-workflow.md  # Development workflow guide
└── README.md          # This file
```

### Tech Stack

#### Frontend (Next.js 16)

- **Framework**: Next.js 16.0.0 with App Router
- **React**: 19.2.0 with Server Components
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **Authentication**: Clerk for Next.js
- **State Management**: React hooks + Context API

#### Backend (NestJS 11)

- **Framework**: NestJS 11.0.1 with Express 5
- **Database**: PostgreSQL with Prisma ORM 6.18+
- **Authentication**: Clerk backend integration
- **Validation**: class-validator and class-transformer
- **API Documentation**: OpenAPI/Swagger (planned)
- **Testing**: Jest with Supertest

#### Database & Infrastructure

- **Database**: Supabase PostgreSQL
- **ORM**: Prisma 6.18+ with TypeScript config
- **Hosting**: (To be determined)
- **CI/CD**: GitHub Actions (planned)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0+ and npm/pnpm
- **PostgreSQL** database (Supabase recommended)
- **Clerk** account for authentication

### Environment Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/hhumaira1/CSE327.git
cd synapse
```

#### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL (Supabase PostgreSQL)
# - DIRECT_URL (Supabase direct connection)
# - CLERK_SECRET_KEY

# - CLERK_PUBLISHABLE_KEY

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start development server
npm run start:dev
```

The backend will be available at `http://localhost:3001`

#### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Required Environment Variables

#### Backend (.env)

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."

# Server Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (.env.local)

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
```

## 🎯 Development Workflow

### Backend-First Approach

The project follows a **backend-first development approach**. Complete the API development before frontend integration:

1. **Phase 1**: Database & Authentication Setup
2. **Phase 2**: Core API Modules (Contacts, Leads, Deals)
3. **Phase 3**: Frontend Integration
4. **Phase 4**: Advanced Features & Integrations
5. **Phase 5**: Testing & Deployment

### Available Scripts

#### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

#### Backend Commands

```bash
npm run start:dev    # Start development server with watch mode
npm run build        # Build for production
npm run start:prod   # Start production server
npm run test         # Run Jest tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run ESLint with auto-fix

# Prisma commands
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma migrate dev  # Create and apply migrations
```

## 📊 Database Schema

### Core Entities

- **Tenant** - Organization/workspace isolation
- **User** - System users with role-based access
- **Contact** - Customer and prospect information
- **Lead** - Potential sales opportunities
- **Deal** - Active sales pipeline entries
- **Pipeline** - Customizable sales stages
- **Interaction** - Communication history
- **Ticket** - Customer support requests

### Multi-Tenant Architecture

Every entity includes a `tenantId` field for data isolation:

```prisma
model Contact {
  id        String   @id @default(cuid())
  tenantId  String   // Ensures data isolation
  // ... other fields
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
}
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/onboard` - Create initial tenant and admin user
- `GET /api/auth/me` - Get current user details

### Contacts (Planned)

- `GET /api/contacts` - List contacts with filtering
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/:id` - Get contact details
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Additional modules (Leads, Deals, Tickets) follow similar RESTful patterns.

## 🎨 UI Components

### Layout Components

- **Navbar** - Navigation with Clerk authentication
- **Footer** - Company information and links
- **Sidebar** - Dashboard navigation (planned)

### Landing Page Sections

- **HeroSection** - Main value proposition
- **StatsSection** - Key metrics and achievements
- **FeaturesSection** - Core functionality highlights
- **TestimonialsSection** - Customer testimonials
- **PricingSection** - Subscription plans
- **CTASection** - Call-to-action prompts

### UI Library (shadcn/ui)

## 🧪 Testing Strategy

### Backend Testing

- **Unit Tests** - Service and controller testing with Jest
- **Integration Tests** - API endpoint testing with Supertest
- **E2E Tests** - Complete workflow testing
- **Database Tests** - Prisma schema and query testing

### Frontend Testing (Planned)

- **Component Tests** - React component testing
- **Integration Tests** - Page and flow testing
- **E2E Tests** - Full user journey testing
- **Accessibility Tests** - WCAG compliance testing

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Clerk production keys configured
- [ ] CORS settings updated
- [ ] SSL certificates installed
- [ ] Performance monitoring setup

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Railway, Render, or AWS
- **Database**: Supabase, PlanetScale, or managed PostgreSQL

## 📚 Additional Resources

- **[Development Workflow](./synapse-crm-workflow.md)** - Detailed development guide
- **[Clerk Documentation](https://clerk.com/docs)** - Authentication setup
- **[Prisma Guide](https://www.prisma.io/docs)** - Database management
- **[Next.js 16 Docs](https://nextjs.org/docs)** - Frontend framework
- **[NestJS Documentation](https://docs.nestjs.com)** - Backend framework
- **[shadcn/ui](https://ui.shadcn.com)** - UI component library

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/hhumaira1/CSE327/issues)
- **Documentation**: Check the [workflow guide](./synapse-crm-workflow.md)
- **Development**: Follow the [quick start guide](#quick-start)

---

**SynapseCRM** - Built with ❤️ for modern businesses by the CSE327 team.
