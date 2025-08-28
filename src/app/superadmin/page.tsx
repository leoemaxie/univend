'use client';

import { useState, useTransition } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { uploadSchools } from './actions';

export default function SuperAdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a CSV file to upload.',
      });
      return;
    }

    startTransition(() => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const schools = results.data as Array<{ name: string; type: string; domain: string }>;
          
          if(!results.meta.fields?.includes('name') || !results.meta.fields?.includes('type') || !results.meta.fields?.includes('domain')) {
            toast({
              variant: 'destructive',
              title: 'Invalid CSV format',
              description: 'The CSV must have "name", "type", and "domain" columns.',
            });
            return;
          }
          
          const response = await uploadSchools(schools);

          if (response.success) {
            toast({
              title: 'Upload Successful',
              description: `${response.count} schools have been added to Firestore.`,
            });
            setFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

          } else {
            toast({
              variant: 'destructive',
              title: 'Upload Failed',
              description: response.error,
            });
          }
        },
        error: (error) => {
          toast({
            variant: 'destructive',
            title: 'CSV Parsing Error',
            description: error.message,
          });
        }
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Super Admin Panel</CardTitle>
          <CardDescription>Upload a CSV file of schools to the Firestore database.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload">School Data CSV File</Label>
              <Input id="file-upload" type="file" accept=".csv" onChange={handleFileChange} />
              <p className="text-sm text-muted-foreground">
                The CSV must have the columns: name, type, domain.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !file}>
              {isPending ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Upload className="mr-2" />
              )}
              Upload to Firestore
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
