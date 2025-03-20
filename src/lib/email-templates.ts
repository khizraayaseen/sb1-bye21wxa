// Create this file with default email templates

import type { EmailType } from "./email-service"

// Default template interface
interface DefaultTemplate {
  name: string
  type: EmailType
  subject: string
  content: string
  is_active: boolean
}

// Default templates for the application
export const defaultTemplates: Record<string, DefaultTemplate> = {
  welcome: {
    name: "Welcome Email",
    type: "welcome",
    subject: "Welcome to WinProd AI!",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png" alt="WinProd AI" style="max-width: 200px;">
      </div>
      
      <h1 style="color: #FF8A00; text-align: center;">Welcome to WinProd AI!</h1>
      
      <p>Hello {{ name }},</p>
      
      <p>Thank you for joining WinProd AI! We're excited to have you on board.</p>
      
      <p>With your new account, you can:</p>
      
      <ul>
        <li>Discover winning products for your eCommerce business</li>
        <li>Access detailed analytics and insights</li>
        <li>Save your favorite products for later reference</li>
        <li>Stay ahead of market trends with our AI-powered recommendations</li>
      </ul>
      
      <p>To get started, simply log in to your account and explore our dashboard.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://winprod.ai/dashboard" style="background-color: #FF8A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
      </div>
      
      <p>If you have any questions or need assistance, don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br>The WinProd AI Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>© 2025 WinProd AI. All rights reserved.</p>
        <p>
          <a href="https://winprod.ai/privacy" style="color: #FF8A00; text-decoration: none;">Privacy Policy</a> | 
          <a href="https://winprod.ai/terms" style="color: #FF8A00; text-decoration: none;">Terms of Service</a>
        </p>
      </div>
    </div>`,
    is_active: true,
  },
  transaction: {
    name: "Transaction Confirmation",
    type: "transaction",
    subject: "Your WinProd AI Payment Confirmation",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png" alt="WinProd AI" style="max-width: 200px;">
      </div>
      
      <h1 style="color: #FF8A00; text-align: center;">Payment Confirmation</h1>
      
      <p>Hello {{ name }},</p>
      
      <p>Thank you for your payment. Your transaction has been successfully processed.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Transaction Details:</h3>
        <p><strong>Date:</strong> {{ date }}</p>
        <p><strong>Transaction ID:</strong> {{ transactionId }}</p>
        <p><strong>Plan:</strong> {{ plan }}</p>
        <p><strong>Amount:</strong> ${{ amount }}</p>
      </div>
      
      <p>You can view your subscription details and billing history in your account settings.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://winprod.ai/account" style="background-color: #FF8A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Account</a>
      </div>
      
      <p>If you have any questions about your payment or subscription, please contact our support team.</p>
      
      <p>Thank you for choosing WinProd AI!</p>
      
      <p>Best regards,<br>The WinProd AI Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>© 2025 WinProd AI. All rights reserved.</p>
        <p>
          <a href="https://winprod.ai/privacy" style="color: #FF8A00; text-decoration: none;">Privacy Policy</a> | 
          <a href="https://winprod.ai/terms" style="color: #FF8A00; text-decoration: none;">Terms of Service</a>
        </p>
      </div>
    </div>`,
    is_active: true,
  },
  marketing: {
    name: "Marketing Newsletter",
    type: "marketing",
    subject: "Discover This Week's Winning Products!",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png" alt="WinProd AI" style="max-width: 200px;">
      </div>
      
      <h1 style="color: #FF8A00; text-align: center;">This Week's Winning Products</h1>
      
      <p>Hello {{ name }},</p>
      
      <p>We've curated a fresh batch of winning products that are trending right now. Don't miss out on these opportunities!</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Featured Product of the Week:</h3>
        <p>{{ featuredProduct }}</p>
        <p>{{ featuredDescription }}</p>
        <div style="text-align: center; margin: 15px 0;">
          <a href="{{ featuredLink }}" style="background-color: #FF8A00; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product</a>
        </div>
      </div>
      
      <p>Check out our dashboard for more winning products and detailed analytics to help grow your business.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://winprod.ai/dashboard" style="background-color: #FF8A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Dashboard</a>
      </div>
      
      <p>Stay ahead of the competition with WinProd AI!</p>
      
      <p>Best regards,<br>The WinProd AI Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>© 2025 WinProd AI. All rights reserved.</p>
        <p>
          <a href="https://winprod.ai/privacy" style="color: #FF8A00; text-decoration: none;">Privacy Policy</a> | 
          <a href="https://winprod.ai/terms" style="color: #FF8A00; text-decoration: none;">Terms of Service</a> | 
          <a href="https://winprod.ai/unsubscribe?email={{ email }}&campaign={{ campaignId }}" style="color: #FF8A00; text-decoration: none;">Unsubscribe</a>
        </p>
      </div>
    </div>`,
    is_active: true,
  },
  password_reset: {
    name: "Password Reset",
    type: "password_reset",
    subject: "Reset Your WinProd AI Password",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png" alt="WinProd AI" style="max-width: 200px;">
      </div>
      
      <h1 style="color: #FF8A00; text-align: center;">Reset Your Password</h1>
      
      <p>Hello {{ name }},</p>
      
      <p>We received a request to reset your password for your WinProd AI account. If you didn't make this request, you can safely ignore this email.</p>
      
      <p>To reset your password, click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ resetLink }}" style="background-color: #FF8A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      
      <p style="word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">{{ resetLink }}</p>
      
      <p>This link will expire in 24 hours for security reasons.</p>
      
      <p>If you didn't request a password reset, please contact our support team immediately.</p>
      
      <p>Best regards,<br>The WinProd AI Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>© 2025 WinProd AI. All rights reserved.</p>
        <p>
          <a href="https://winprod.ai/privacy" style="color: #FF8A00; text-decoration: none;">Privacy Policy</a> | 
          <a href="https://winprod.ai/terms" style="color: #FF8A00; text-decoration: none;">Terms of Service</a>
        </p>
      </div>
    </div>`,
    is_active: true,
  },
}

