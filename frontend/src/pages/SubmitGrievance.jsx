import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { 
  FileText, 
  Send, 
  MapPin, 
  Globe, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  UploadCloud,
  X,
  Eye
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CATEGORIES = [
  'Water Supply',
  'Sanitation & Waste Management',
  'Electricity & Power',
  'Roads & Transport Infrastructure',
  'Municipal & Civic Services',
  'Public Health & Hospitals',
  'Revenue & Property Assessment',
  'Education & Schools',
  'Other Public Service',
];

const PREFERRED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
];

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function SubmitGrievance() {
  const { user, profile } = useAuth();
  const { t, tDept, tStatus, language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferred_language || language || 'en'
  );
  
  // Image attachments state: array of { file, name, size, type, previewUrl, base64 }
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submittedGrievance, setSubmittedGrievance] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Grievance subject is required';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (subject.trim().length > 250) {
      newErrors.subject = 'Subject must be 250 characters or less';
    }

    if (!description.trim()) {
      newErrors.description = 'Grievance description is required';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Please provide a detailed description (minimum 15 characters)';
    } else if (description.trim().length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = async (e) => {
    setAttachmentError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > MAX_IMAGES) {
      setAttachmentError(`You can upload a maximum of ${MAX_IMAGES} images per grievance.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newAttachments = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setAttachmentError(`Unsupported file format "${file.name}". Allowed types: JPG, PNG, WEBP.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setAttachmentError(`File "${file.name}" exceeds the maximum 5 MB size limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Convert file to base64 Data URL
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (err) {
        console.error('File reading failed:', err);
        setAttachmentError(`Could not read file "${file.name}".`);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setAttachmentError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare images payload for backend storage
      const imagesPayload = attachments.map((att) => ({
        name: att.name,
        type: att.type,
        size: att.size,
        data: att.data,
      }));

      const response = await api.submitGrievance({
        subject,
        description,
        category,
        location,
        preferred_language: preferredLanguage,
        images: imagesPayload,
      });

      setSubmittedGrievance(response.data);
    } catch (err) {
      console.error('[SubmitGrievance error]:', err);
      setServerError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setLocation('');
    setAttachments([]);
    setAttachmentError(null);
    setSubmittedGrievance(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link
            to="/citizen"
            id="submit-back-to-dashboard"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-gov-900 transition group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>{t('common.back')}</span>
          </Link>

          <span className="text-xs px-2.5 py-0.5 rounded bg-gov-100 text-gov-800 font-semibold border border-gov-200">
            {t('home.feature3Title')}
          </span>
        </div>

        {/* Success Confirmation View */}
        {submittedGrievance ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-emerald-200 shadow-gov text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                {t('citizen.submitPage.successTitle')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t('citizen.submitPage.successTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('citizen.submitPage.successMessage')}
              </p>
            </div>

            {/* Generated Grievance Ticket Badge */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('citizen.submitPage.ticketIdLabel')}</span>
                <span className="text-xs font-mono font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                  {submittedGrievance.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">{t('citizen.submitPage.subjectLabel')}:</span>
                <span className="font-bold text-slate-800 truncate max-w-[240px]">{submittedGrievance.subject}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{t('citizen.submitPage.assignedDeptLabel')}:</span>
                <span className="font-semibold text-slate-700">{tDept(submittedGrievance.category || 'General')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{t('common.status')}:</span>
                <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {tStatus(submittedGrievance.status || 'submitted')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/citizen"
                id="submit-success-view-dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-gov-900 hover:bg-gov-950 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <span>{t('navbar.goToDashboard')}</span>
              </Link>

              <button
                type="button"
                onClick={handleReset}
                id="submit-success-submit-another"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition"
              >
                <span>{t('citizen.submitNewGrievance')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grievance Submission Form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-gov overflow-hidden">
            
            {/* Form Header */}
            <div className="p-6 sm:p-8 bg-slate-900 text-white space-y-2">
              <div className="flex items-center space-x-2 text-gov-300 text-xs font-semibold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>{t('citizen.submitPage.title')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('citizen.submitPage.title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {t('citizen.submitPage.subtitle')}
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" noValidate>
              
              {/* Server Error Alert */}
              {serverError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{serverError}</span>
                </div>
              )}

              {/* Subject Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="grievance-subject" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t('citizen.submitPage.subjectLabel')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {subject.length}/250
                  </span>
                </div>
                <input
                  id="grievance-subject"
                  type="text"
                  value={subject}
                  maxLength={250}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors({ ...errors, subject: null });
                  }}
                  placeholder={t('citizen.submitPage.subjectPlaceholder')}
                  className={`block w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border ${
                    errors.subject
                      ? 'border-red-500 text-red-900 focus:ring-2 focus:ring-red-400'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-gov-600'
                  }`}
                />
                {errors.subject && (
                  <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.subject}</span>
                  </p>
                )}
              </div>

              {/* Category & Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="grievance-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t('citizen.submitPage.categoryLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <select
                      id="grievance-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-gov-600"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {tDept(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Input */}
                <div className="space-y-1.5">
                  <label htmlFor="grievance-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t('citizen.submitPage.locationLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="grievance-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('citizen.submitPage.locationPlaceholder')}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-gov-600"
                    />
                  </div>
                </div>

              </div>

              {/* Description TextArea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="grievance-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t('citizen.submitPage.descriptionLabel')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {description.length}/5000
                  </span>
                </div>
                <textarea
                  id="grievance-description"
                  rows={5}
                  value={description}
                  maxLength={5000}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: null });
                  }}
                  placeholder={t('citizen.submitPage.descriptionPlaceholder')}
                  className={`block w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border ${
                    errors.description
                      ? 'border-red-500 text-red-900 focus:ring-2 focus:ring-red-400'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-gov-600'
                  }`}
                />
                {errors.description ? (
                  <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.description}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {t('citizen.submitPage.descriptionHint')}
                  </p>
                )}
              </div>

              {/* Attach Evidence Section (Phase 12) */}
              <div className="space-y-3 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-gov-800" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {t('citizen.submitPage.attachmentTitle')}
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {t('citizen.submitPage.attachmentDesc')}
                  </span>
                </div>

                {attachmentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{attachmentError}</span>
                  </div>
                )}

                {/* Upload Control */}
                {attachments.length < MAX_IMAGES && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="evidence-file-input"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="add-images-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-dashed border-slate-400 hover:border-gov-600 shadow-2xs transition-all space-x-2"
                    >
                      <UploadCloud className="w-4 h-4 text-gov-700" />
                      <span>+ {t('citizen.submitPage.addPhotos')} ({attachments.length}/{MAX_IMAGES})</span>
                    </button>
                  </div>
                )}

                {/* Thumbnails Preview Grid */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="relative group bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3"
                      >
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0 cursor-pointer"
                          onClick={() => setPreviewModalImage(att.previewUrl)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title={t('citizen.submitPage.removePhoto')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Language Selection */}
              <div className="space-y-1.5">
                <label htmlFor="grievance-language" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {t('citizen.submitPage.langLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    id="grievance-language"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-gov-600"
                  >
                    {PREFERRED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('auth.verifiedBadge') || 'Authenticated Citizen ID attached'}</span>
                </div>

                <button
                  type="submit"
                  id="submit-grievance-btn"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-offset-2 focus:ring-gov-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>{t('citizen.submitPage.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      <span>{t('citizen.submitPage.submitButton')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

      </main>

      {/* Image Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImage}
              alt="Evidence preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

