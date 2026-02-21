import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Search, Mail } from 'lucide-react';

interface WaitlistEntry {
  email: string;
  timestamp: string;
}

export function AAAWaitlistAdmin() {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch this data from your backend
    // For now, we'll get it from localStorage
    const fetchWaitlistEntries = () => {
      setIsLoading(true);
      try {
        const storedEntries = localStorage.getItem('aaa-waitlist-emails');
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          // Convert simple email array to objects with timestamps if needed
          const formattedEntries = Array.isArray(parsedEntries) 
            ? parsedEntries.map((email: string) => {
                // Check if it's already an object
                if (typeof email === 'object' && email.email) {
                  return email;
                }
                // Otherwise create an object
                return { 
                  email, 
                  timestamp: new Date().toISOString() 
                };
              })
            : [];
          setWaitlistEntries(formattedEntries);
        }
      } catch (error) {
        console.error('Error fetching waitlist entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlistEntries();
  }, []);

  const handleDeleteEntry = (email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email} from the waitlist?`)) {
      const updatedEntries = waitlistEntries.filter(entry => entry.email !== email);
      setWaitlistEntries(updatedEntries);
      localStorage.setItem('aaa-waitlist-emails', JSON.stringify(updatedEntries));
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Timestamp'],
      ...waitlistEntries.map(entry => [entry.email, entry.timestamp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aaa-waitlist-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEntries = waitlistEntries.filter(entry => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AAA Waitlist</h1>
          <p className="text-white/60">
            Manage users who have signed up for the AI Agent Artists waitlist.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="glass-button flex items-center"
          disabled={waitlistEntries.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Search emails..."
            className="pl-10 w-full p-3 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : waitlistEntries.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-medium mb-2">No waitlist entries yet</h3>
            <p className="text-white/60">
              When users sign up for the AAA waitlist, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Date Added</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <motion.tr
                    key={entry.email}
                    className="border-b border-white/5 hover:bg-white/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-sm">{entry.email}</td>
                    <td className="px-4 py-4 text-sm text-white/60">
                      {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.email)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Delete Entry"
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
  );
}

export default AAAWaitlistAdmin;
