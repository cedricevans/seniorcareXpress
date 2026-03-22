# SeniorCare Xpress: Messaging & Payments Implementation Guide

## 📨 CURRENT MESSAGING SYSTEM

### How Messaging Works
Your app uses **PocketBase** for messaging - NOT external services like Twilio or SendGrid.

**Current Flow:**
1. Users send messages via the `MessagesPage` component
2. Messages stored in PocketBase `messages` collection with fields:
   - `sender_id` (relation to users)
   - `recipient_id` (relation to users)
   - `content` (text)
   - `read` (boolean)
   - `created` (timestamp)
3. Real-time updates via PocketBase subscriptions (not yet implemented)

**Current Location:** `/apps/web/src/pages/MessagesPage.jsx`

### Database Schema
```javascript
// messages collection (already exists)
{
  sender_id: relation('users'),
  recipient_id: relation('users'),
  content: text,
  read: boolean,
  created: auto-timestamp,
  updated: auto-timestamp
}
```

### What Works Now
✅ One-to-one messaging between users
✅ Unread message badges
✅ Message history sorted by date
✅ PocketBase permissions control who sees what

### What's Missing for Production
❌ Real-time message updates (need socket.io or PocketBase realtime subscription)
❌ Typing indicators
❌ Message delivery status (sent, delivered, read)
❌ File/image attachments
❌ Group chat support

---

## 💳 PAYMENT SYSTEM (NEW)

### Option A: Stripe (Recommended - Most Flexible)

#### Step 1: Install Dependencies
```bash
npm install stripe @stripe/react-js @stripe/js
```

#### Step 2: Set Environment Variables
**Railway:**
```
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_STRIPE_SECRET_KEY=sk_live_xxxxx (backend only)
```

**Local (.env):**
```
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

#### Step 3: Create Payment Links Page
Create `/apps/web/src/pages/PaymentLinksPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentLinksPage = () => {
  const [patients, setPatients] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [form, setForm] = useState({
    patient_id: '',
    amount: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPatients();
    loadPaymentLinks();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await pb.collection('patients').getFullList();
      setPatients(res);
    } catch (err) {
      toast.error('Failed to load patients');
    }
  };

  const loadPaymentLinks = async () => {
    try {
      // Assuming you create a 'payment_links' collection
      const res = await pb.collection('payment_links').getFullList({
        expand: 'patient_id'
      });
      setPaymentLinks(res);
    } catch (err) {
      console.log('Payment links collection not yet created');
    }
  };

  const createPaymentLink = async () => {
    if (!form.patient_id || !form.amount || !form.description) {
      toast.error('Fill all fields');
      return;
    }

    setCreating(true);
    try {
      // Call your backend API to create Stripe payment link
      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(form.amount) * 100), // Convert to cents
          description: form.description,
          patient_id: form.patient_id,
        })
      });

      const data = await response.json();
      
      // Save to PocketBase
      await pb.collection('payment_links').create({
        patient_id: form.patient_id,
        amount: form.amount,
        description: form.description,
        stripe_url: data.url,
        stripe_id: data.id,
        status: 'pending'
      });

      setForm({ patient_id: '', amount: '', description: '' });
      loadPaymentLinks();
      toast.success('Payment link created!');
    } catch (err) {
      toast.error('Failed to create payment link');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Links</h1>
        <p className="text-muted-foreground mt-1">Send payment links to patients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Link Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create Payment Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient</label>
              <select 
                value={form.patient_id}
                onChange={(e) => setForm({...form, patient_id: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
                placeholder="99.99"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Service fee, care plan, etc"
              />
            </div>
            <Button 
              onClick={createPaymentLink}
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Generate Link'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Links List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Payment Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentLinks.length === 0 ? (
                <p className="text-muted-foreground">No payment links yet</p>
              ) : (
                paymentLinks.map(link => (
                  <div key={link.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {link.expand?.patient_id?.first_name} {link.expand?.patient_id?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">${link.amount} • {link.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(link.stripe_url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <a href={link.stripe_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentLinksPage;
```

#### Step 4: Backend API Endpoint
Create `/apps/api/src/routes/payments.js`:

```javascript
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, description, patient_id } = req.body;

    const link = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || 'Senior Care Service',
              description: `Patient ID: ${patient_id}`
            },
            unit_amount: amount, // Already in cents from frontend
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.WEB_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        },
      },
    });

    res.json({
      url: link.url,
      id: link.id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
```

#### Step 5: PocketBase Schema Update
Add to `setup.js`:

```javascript
const paymentLinksSchema = {
  name: 'payment_links',
  type: 'base',
  fields: [
    { name: 'patient_id', type: 'relation', collectionId: 'patients', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'description', type: 'text', required: true },
    { name: 'stripe_url', type: 'url', required: true },
    { name: 'stripe_id', type: 'text', required: true },
    { name: 'status', type: 'select', options: ['pending', 'paid', 'expired'] },
  ],
  listRule: '@request.auth.role = "admin"',
  viewRule: '@request.auth.role = "admin" || patient_id.user_id = @request.auth.id',
  createRule: '@request.auth.role = "admin"',
};
```

#### Step 6: Patient Payment Portal
For patients to make payments, create `/apps/web/src/pages/PatientPayments.jsx` that shows pending payment links.

---

## 🚀 IMPLEMENTATION PRIORITIES

### Phase 1 (Week 1): Messaging Improvements
- [ ] Add real-time message updates using PocketBase subscriptions
- [ ] Add typing indicators
- [ ] Improve UI with better message threading
- **Effort:** 2-3 hours

### Phase 2 (Week 2): Basic Payments
- [ ] Install Stripe packages
- [ ] Create admin payment link generator
- [ ] Add payment_links collection to PocketBase
- [ ] Create backend API endpoint
- **Effort:** 4-5 hours

### Phase 3 (Week 3): Patient Payment Portal
- [ ] Create patient-facing payment page
- [ ] Add payment success/failure handling
- [ ] Webhook for payment confirmation
- **Effort:** 3-4 hours

### Phase 4 (Week 4): Advanced Features
- [ ] Payment history/invoices
- [ ] Automated payment reminders
- [ ] Recurring billing
- **Effort:** 5-6 hours

---

## 📋 DATABASE ADDITIONS NEEDED

```javascript
// 1. payment_links (new collection)
{
  patient_id: relation('patients'),
  amount: number,
  description: text,
  stripe_url: url,
  stripe_id: text,
  status: select('pending', 'paid', 'expired'),
  created: timestamp,
}

// 2. payments (new collection - for historical records)
{
  patient_id: relation('patients'),
  amount: number,
  stripe_charge_id: text,
  stripe_invoice_id: text,
  status: select('succeeded', 'pending', 'failed'),
  created: timestamp,
}

// 3. Extend users collection
{
  stripe_customer_id: text (optional - for recurring billing)
}
```

---

## 🔑 KEY STRIPE CONCEPTS

### Payment Links vs Checkout
- **Payment Links**: Shareable URLs, great for sending to patients via email/message
- **Checkout**: Embedded in your app, more control

### Required Fields
- `VITE_STRIPE_PUBLIC_KEY` - Public, safe to expose
- `STRIPE_SECRET_KEY` - Private, backend only!

### Testing
- Test Mode: Use `pk_test_` and `sk_test_` keys
- Live Mode: Use `pk_live_` and `sk_live_` keys

---

## 🔗 QUICK START COMMANDS

```bash
# Install Stripe
npm install stripe @stripe/react-js @stripe/js

# Get Stripe keys from: https://dashboard.stripe.com/apikeys

# Test API call
curl -H "Authorization: Bearer sk_test_xxxx" \
  https://api.stripe.com/v1/customers

# Webhook setup (for payment notifications)
stripe listen --forward-to localhost:3001/webhooks/stripe
```

---

## 📞 NEXT STEPS

Would you like me to:
1. **Implement real-time messaging** with PocketBase subscriptions?
2. **Set up the Stripe payment system** (start with basic payment links)?
3. **Create the patient payment portal**?
4. **Set up webhook handling** for payment notifications?

Just let me know which part you want to tackle first!
