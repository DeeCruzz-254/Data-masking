import { useState, useCallback } from 'react';
import axios from 'axios';
import { maskEmail, maskPhone, maskID, maskCard, formatCardInput } from '../utils/masking';

const INITIAL_FORM = { name: '', email: '', phone: '', nationalId: '', cardNumber: '' };
const INITIAL_ERRORS = {};

export function useForm() {
  const [fields, setFields]         = useState(INITIAL_FORM);
  const [masked, setMasked]         = useState(INITIAL_FORM);
  const [errors, setErrors]         = useState(INITIAL_ERRORS);
  const [status, setStatus]         = useState('idle'); // idle | submitting | success | error
  const [serverError, setServerError] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /** Apply field-specific mask and update both raw + masked state */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // Special formatting for card number input
    const processed = name === 'cardNumber' ? formatCardInput(value) : value;

    setFields(prev => ({ ...prev, [name]: processed }));
    setErrors(prev => ({ ...prev, [name]: '' }));

    // Compute masked value immediately
    const maskedValue = (() => {
      switch (name) {
        case 'email':      return maskEmail(processed);
        case 'phone':      return maskPhone(processed);
        case 'nationalId': return maskID(processed);
        case 'cardNumber': return maskCard(processed);
        default:           return processed; // name — no masking
      }
    })();

    setMasked(prev => ({ ...prev, [name]: maskedValue }));
  }, []);

  /** Client-side field validation */
  const validate = useCallback(() => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s\-().]{5,20}$/;

    if (fields.email && !emailRegex.test(fields.email)) errs.email = 'Invalid email address.';
    if (fields.phone && !phoneRegex.test(fields.phone)) errs.phone = 'Invalid phone number.';
    if (fields.nationalId && fields.nationalId.length < 3)
      errs.nationalId = 'ID must be at least 3 characters.';
    if (fields.cardNumber) {
      const digits = fields.cardNumber.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19)
        errs.cardNumber = 'Card must be 13–19 digits.';
    }
    if (!Object.values(fields).some(Boolean))
      errs._form = 'Please fill in at least one field.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields]);

  /** Submit raw fields to API — server will mask and persist */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setServerError('');

    try {
      const { data } = await axios.post('/api/submissions', fields);
      setStatus('success');
      setFields(INITIAL_FORM);
      setMasked(INITIAL_FORM);
    } catch (err) {
      setStatus('error');
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setServerError(err.response?.data?.error || 'Submission failed. Please try again.');
      }
    }
  }, [fields, validate]);

  /** Fetch stored (masked) submissions from the API */
  const fetchSubmissions = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await axios.get('/api/submissions');
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFields(INITIAL_FORM);
    setMasked(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setStatus('idle');
    setServerError('');
  }, []);

  return {
    fields, masked, errors, status, serverError,
    submissions, loadingHistory,
    handleChange, handleSubmit, fetchSubmissions, reset,
  };
}
