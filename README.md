# Bonus Stock Manager

A comprehensive stock management system with POS (Point of Sale) capabilities, built with Next.js and TypeScript.

## Features

- 📦 **Inventory Management** - Manage products, stock levels, and categories
- 🛒 **Point of Sale (POS)** - Fast checkout with barcode scanning
- 📱 **Mobile Barcode Scanner** - Scan barcodes using your phone's camera
- 🏪 **Multi-Shop Support** - Manage multiple shop locations
- 👥 **User Management** - Role-based access control (Admin, Manager, Staff)
- 📧 **Email Invitations** - Invite team members via email
- 📊 **Sales & Reports** - Track sales, revenue, and analytics
- 🏷️ **IMEI Management** - Track IMEI numbers for phones and devices
- 🧾 **Receipt Printing** - Print and download receipts
- 👤 **Customer Management** - Maintain customer database
- 📦 **Supplier Management** - Track suppliers and purchase records

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS, Radix UI
- **State Management**: LocalStorage-based store
- **Barcode Scanning**: ZXing Library
- **Email**: Nodemailer
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dhani-1428/bonusstockmanager.git
cd bonusstockmanager
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Email Setup (Optional)

To enable email invitations, create a `.env.local` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords

## Usage

### First Time Setup

1. Sign up with your email and create your first shop
2. Add products to your inventory
3. Start processing sales at the POS

### Barcode Scanning

- **USB Scanner**: Connect a USB barcode scanner - it works automatically
- **Mobile Camera**: Use the camera button to scan barcodes with your phone
- **Manual Entry**: Type barcodes manually in the input field

### User Roles

- **Admin**: Full system access
- **Manager**: Manage products, inventory, sales, and reports
- **Staff**: Process sales and print receipts

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/             # React components
│   ├── dashboard/          # Dashboard-specific components
│   └── ui/                # UI components
├── lib/                    # Utilities and store
└── public/                 # Static assets
```

## Features in Detail

### Inventory Management
- Add/edit/delete products
- Track stock quantities
- Low stock alerts
- Category management
- IMEI tracking for phones

### POS System
- Fast barcode scanning
- Cart management
- Multiple payment methods
- Customer information capture
- Receipt generation

### Sales & Reports
- Sales history
- Revenue tracking
- Product analytics
- Refund processing

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
