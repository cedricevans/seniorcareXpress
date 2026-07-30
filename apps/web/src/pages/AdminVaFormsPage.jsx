import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';

const FORMS = [
  {
    number: '21-0779',
    title: 'Request for Nursing Home Information',
    description: 'In connection with a claim for Aid and Attendance',
    path: '/admin/va-forms/21-0779',
  },
  {
    number: '21-0845',
    title: 'Authorization to Disclose Personal Information',
    description: 'Authorization to disclose personal information to a third party',
    path: '/admin/va-forms/21-0845',
  },
  {
    number: '21-2680',
    title: 'Examination for Housebound Status or Aid & Attendance',
    description: 'Examination for housebound status or permanent need for regular aid and attendance',
    path: '/admin/va-forms/21-2680',
  },
  {
    number: '21P-8416',
    title: 'Medical Expense Report',
    description: 'Report unreimbursed medical, in-home care, and mileage expenses',
    path: '/admin/va-forms/21p-8416',
  },
  {
    number: '21P-527EZ',
    title: 'Application for Veterans Pension',
    description: 'Sections I-IX available (identity, service, marital status, children, income summary)',
    path: '/admin/va-forms/21p-527ez',
  },
  {
    number: '21P-534EZ',
    title: 'Application for D.I.C., Survivors Pension, and/or Accrued Benefits',
    description: 'Sections I-II available (identity, contact info, what you\'re claiming). Remaining sections must be completed manually.',
    path: '/admin/va-forms/21p-534ez',
  },
];

const AdminVaFormsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">VA Forms</h1>
      </div>
      <p className="text-slate-500 mb-8">Select a form to enter veteran information and generate the completed PDF.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FORMS.map((form) => (
          <Link
            key={form.number}
            to={form.path}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">VA Form {form.number}</div>
              <div className="font-semibold text-slate-900 mb-1">{form.title}</div>
              <div className="text-sm text-slate-500">{form.description}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminVaFormsPage;
