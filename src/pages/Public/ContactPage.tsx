import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Mail, User, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import type { ValidationResult } from '@/lib/validators';

const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  
  return { isValid: true };
};

const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  return { isValid: true };
};

const validateSubject = (subject: string): ValidationResult => {
  if (!subject.trim()) {
    return { isValid: false, error: 'Subject is required' };
  }
  
  if (subject.trim().length < 5) {
    return { isValid: false, error: 'Subject must be at least 5 characters' };
  }
  
  if (subject.trim().length > 200) {
    return { isValid: false, error: 'Subject must be less than 200 characters' };
  }
  return { isValid: true };
};

const validateMessage = (message: string): ValidationResult => {
  if (!message.trim()) {
    return { isValid: false, error: 'Message is required' };
  }
  
  if (message.trim().length < 10) {
    return { isValid: false, error: 'Message must be at least 10 characters' };
  }
  
  if (message.trim().length > 5000) {
    return { isValid: false, error: 'Message must be less than 5000 characters' };
  }
  return { isValid: true };
};

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FieldErrors {
  [key: string]: string;
}

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  wallet_address: string | null;
}

interface ContactResponse {
  message: string;
  id?: number;
}
export default function ContactPage() {
  const { address } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error!;
    }
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    // Validar subject
    const subjectValidation = validateSubject(formData.subject);
    if (!subjectValidation.isValid) {
      errors.subject = subjectValidation.error!;
    }
    const messageValidation = validateMessage(formData.message);
    if (!messageValidation.isValid) {
      errors.message = messageValidation.error!;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (error) {
      setError('');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData: ContactRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        wallet_address: address || null,
      };

      const response = await fetch(buildApiUrl('/api/v1/contact/'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: ContactResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as any).detail || 
          'Something went wrong while sending the message'
        );
      }
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFieldErrors({});
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error sending message. Please try again.';
      setError(errorMessage);
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };
  const FormField = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    icon: Icon,
    multiline = false,
    rows = 6,
    placeholder,
    required = true,
  }: {
    label: string;
    name: keyof FormData;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    required?: boolean;
  }) => {
    const hasError = !!fieldErrors[name];
    const errorId = `${name}-error`;

    const baseClasses = `w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition ${
      hasError
        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
        : 'border-gray-300 focus:ring-purple-300 focus:border-purple-500'
    }`;

    return (
      <div>
        <label 
          htmlFor={name}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
        >
          <Icon size={20} />
          {label} {required && '*'}
        </label>
        
        {multiline ? (
          <textarea
            id={name}
            name={name}
            required={required}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} resize-none`}
            placeholder={placeholder}
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            placeholder={placeholder}
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError}
          />
        )}
        
        {hasError && (
          <p id={errorId} className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {fieldErrors[name]}
          </p>
        )}
        
        {name === 'message' && !hasError && (
          <p className="mt-1 text-xs text-gray-500">
            {formData.message.length} / 5000 characters
          </p>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Mail className="text-purple-600" size={40} />
            Contact Us
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Have questions? We're here to help. Send us a message and we'll respond soon.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Message sent successfully!</h3>
                <p className="text-green-700 text-sm">
                  Thank you for contacting us. We'll get back to you as soon as possible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 font-bold text-xl leading-none"
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-purple-100"
          noValidate
        >
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            icon={User}
            placeholder="Your full name"
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            icon={Mail}
            placeholder="your@email.com"
          />

          <FormField
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={(value) => handleInputChange('subject', value)}
            icon={MessageSquare}
            placeholder="What is your message about?"
          />

          <FormField
            label="Message"
            name="message"
            value={formData.message}
            onChange={(value) => handleInputChange('message', value)}
            icon={MessageSquare}
            multiline
            placeholder="Write your message here..."
          />

          {/* Wallet Info */}
          {address && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Wallet connected
                  </p>
                  <p className="text-xs text-blue-700 font-mono break-all">
                    Your address will be included: {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send Message
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            * Required fields
          </p>
        </form>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Other Ways to Contact</h3>
          <div className="space-y-3 text-center text-sm text-gray-600">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:contact@ethernity.io" className="text-purple-600 hover:underline">
                contact@ethernity.io
              </a>
            </p>
            <p>
              <strong>Response time:</strong> 24-48 business hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}