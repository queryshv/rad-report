"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin';

  const handleAdminSignIn = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem('admin', 'true');
      router.push('/admin');
    } else {
      toast({
        variant: "destructive",
        title: "ចូលជាអ្នកគ្រប់គ្រងបរាជ័យ",
        description: "ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។",
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAdminSignIn();
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex justify-center items-center h-screen font-khmer">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter the admin password to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-password">ពាក្យសម្ងាត់</Label>
            <Input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-card text-card-foreground placeholder:text-card-foreground/70"
            />
          </div>
          <Button onClick={handleAdminSignIn} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">ចូល</Button>
        </CardContent>
        <Button onClick={() => router.push('/')} variant="outline" className="w-full mt-2">Back</Button>
      </Card>
    </main>
  );
}



