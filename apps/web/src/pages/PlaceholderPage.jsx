
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>{title} | SeniorCare Xpress</title>
      </Helmet>
      
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">Manage your {title.toLowerCase()} here.</p>
      </div>

      <Card className="border-0 shadow-soft rounded-2xl">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Under Construction</h2>
          <p className="text-muted-foreground max-w-md">
            This module is currently being built. Check back soon for full functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
