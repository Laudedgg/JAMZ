import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Search, MessageSquare, Mail, User } from 'lucide-react';

interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export function ContactSubmissionsAdmin() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  useEffect(() => {
    // In a real application, you would fetch this data from your backend
    // For now, we'll get it from localStorage
    const fetchSubmissions = () => {
      setIsLoading(true);
      try {
        const storedSubmissions = localStorage.getItem('contact-requests');
        if (storedSubmissions) {
          const parsedSubmissions = JSON.parse(storedSubmissions);
          setSubmissions(parsedSubmissions);
        }
      } catch (error) {
        console.error('Error fetching contact submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleDeleteSubmission = (timestamp: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      const updatedSubmissions = submissions.filter(sub => sub.timestamp !== timestamp);
      setSubmissions(updatedSubmissions);
      localStorage.setItem('contact-requests', JSON.stringify(updatedSubmissions));
      
      if (selectedSubmission?.timestamp === timestamp) {
        setSelectedSubmission(null);
      }
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Message', 'Timestamp'],
      ...submissions.map(sub => [
        `"${sub.name.replace(/"/g, '""')}"`, 
        `"${sub.email.replace(/"/g, '""')}"`, 
        `"${sub.message.replace(/"/g, '""')}"`, 
        sub.timestamp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contact-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contact Form Submissions</h1>
          <p className="text-white/60">
            View and manage messages from the "Get in Touch" contact form.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="glass-button flex items-center"
          disabled={submissions.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40" />
              </div>
              <input
                type="text"
                placeholder="Search submissions..."
                className="pl-10 w-full p-3 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <h3 className="text-xl font-medium mb-2">No contact submissions yet</h3>
                <p className="text-white/60">
                  When users submit the contact form, their messages will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-white/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission, index) => (
                      <motion.tr
                        key={submission.timestamp}
                        className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                          selectedSubmission?.timestamp === submission.timestamp ? 'bg-white/10' : ''
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <td className="px-4 py-4 text-sm">{submission.name}</td>
                        <td className="px-4 py-4 text-sm text-white/60">{submission.email}</td>
                        <td className="px-4 py-4 text-sm text-white/60">
                          {new Date(submission.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubmission(submission.timestamp);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedSubmission ? (
            <motion.div 
              className="glass-card p-6 sticky top-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-bold mb-4">Message Details</h2>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 mr-2 text-white/60" />
                  <span className="text-sm text-white/60">From:</span>
                </div>
                <p className="text-lg font-medium">{selectedSubmission.name}</p>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Mail className="w-4 h-4 mr-2 text-white/60" />
                  <span className="text-sm text-white/60">Email:</span>
                </div>
                <p className="text-lg">
                  <a 
                    href={`mailto:${selectedSubmission.email}`} 
                    className="text-primary hover:underline"
                  >
                    {selectedSubmission.email}
                  </a>
                </p>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-4 h-4 mr-2 text-white/60" />
                  <span className="text-sm text-white/60">Message:</span>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-white/10 whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>
              
              <div className="text-sm text-white/40 mt-6">
                Received on {new Date(selectedSubmission.timestamp).toLocaleDateString()} at {new Date(selectedSubmission.timestamp).toLocaleTimeString()}
              </div>
              
              <div className="mt-6 flex space-x-3">
                <a 
                  href={`mailto:${selectedSubmission.email}?subject=Re: Your message to Jamz.fun`} 
                  className="glass-button-primary flex-1 justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply
                </a>
                <button 
                  onClick={() => handleDeleteSubmission(selectedSubmission.timestamp)}
                  className="glass-button flex-1 justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <h3 className="text-xl font-medium mb-2">No message selected</h3>
              <p className="text-white/60">
                Click on a submission from the list to view details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactSubmissionsAdmin;
