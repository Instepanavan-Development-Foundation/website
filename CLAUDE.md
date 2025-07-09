# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a donation-based website for the Instepanavan Development Foundation, built with a headless CMS architecture:

- **Frontend**: Next.js 15 with App Router (`/client/`)
- **Backend**: Strapi 5 headless CMS (`/server/`)
- **Database**: PostgreSQL
- **Queue System**: Hatchet for background job processing
- **Payment Integration**: Ameriabank payment gateway

## Common Development Commands

### Frontend (client/)
```bash
cd client
npm run dev          # Start development server with turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint with auto-fix
```

### Backend (server/)
```bash
cd server
npm run dev          # Start Strapi development server
npm run build        # Build Strapi admin panel
npm run start        # Start production server
npm test             # Run Jest tests
```

### Docker Deployment
```bash
make deploy          # Pull, build, and deploy to production
make build           # Build Docker images
make up              # Start production containers
make down            # Stop production containers
```

## Architecture

### Content Management System
Strapi manages these content types:
- **blogs**: Blog posts with rich text, images, and contributor attribution
- **projects**: Donation projects with funding goals and progress tracking
- **contributors**: Team member profiles with social links
- **users**: Extended user authentication and payment methods
- **payment-methods**: Saved payment methods for users
- **project-payments**: Payment records and transaction logs
- **static-pages**: CMS-managed pages
- **site-config**: Global site settings

### Payment System
- Ameriabank payment gateway integration
- Support for one-time and recurring donations
- Background processing via Hatchet for recurring payments
- Payment logging and audit trail with proper order ID generation

### Data Flow
1. Next.js frontend fetches data via `/src/helpers/getData.ts`
2. Strapi API provides REST endpoints with automatic generation
3. Background jobs handled by Hatchet worker system
4. Authentication via JWT tokens with role-based access

### Key Technologies
- **Frontend**: NextUI/HeroUI components, Tailwind CSS, React Markdown
- **Backend**: TypeScript, PostgreSQL, custom payment controllers
- **Infrastructure**: Docker, Nginx reverse proxy, SSL certificates

## File Structure Patterns

### Frontend Components
- `/components/home/` - Homepage-specific components
- `/components/` - Reusable UI components
- `/app/` - Next.js App Router pages
- `/src/models/` - TypeScript data models
- `/src/helpers/` - Utility functions for API calls

### Backend API Structure
- `/src/api/[content-type]/` - Strapi content type implementations
- `/src/api/[content-type]/controllers/` - Custom business logic
- `/src/api/[content-type]/services/` - Data access layer
- `/src/api/[content-type]/routes/` - API endpoint definitions

## Important Notes

- The application uses slug-based URLs for SEO optimization
- Payment processing requires proper environment variables for Ameriabank
- Background jobs are essential for recurring payment processing
- The system supports Armenian localization for the UI
- All API calls should use the `getData()` helper for consistency
- Docker containers communicate via the nginx proxy configuration

## Development Setup

The application is designed to run in Docker containers but can be developed locally:
1. Ensure PostgreSQL is running
2. Configure environment variables in both client and server
3. Start Strapi backend first, then Next.js frontend
4. Use the Makefile for production deployment workflows