'use client';

import { useEffect, useState } from 'react';
import { getLoginLogs } from '@/integrations/supabase/login-logs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoginLogs() {
      try {
        const { data, error } = await getLoginLogs();
        
        if (error) {
          setError(error.message);
        } else {
          setLoginLogs(data || []);
        }
      } catch (err) {
        setError('Failed to load login logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLoginLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">User Login Dashboard</h1>
          <p className="text-gray-600 mt-2">View recent user login activity</p>
        </header>

        {loginLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No login logs found</div>
            <p className="text-gray-400 mt-2">Users will appear here after logging in</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loginLogs.map((log) => (
              <Card key={log.id} className="bg-white/70 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold text-gray-900">User Login</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {new Date(log.last_login).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">User ID</p>
                      <p className="font-mono text-gray-900 break-all">{log.user_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900 truncate">{log.email || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Login Time</p>
                      <p className="text-gray-900">
                        {new Date(log.last_login).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recorded At</p>
                      <p className="text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}