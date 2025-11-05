'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/auth';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const authSchema = z.object({
  realm: z.string().min(1, 'Realm is required'),
  userToken: z.string().min(1, 'User token is required'),
  serverUrl: z.string().url('Must be a valid URL').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { setCredentials } = useAuthStore();
  const { connect } = useMCPConnection();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      realm: process.env.NEXT_PUBLIC_QUICKBASE_REALM || '',
      userToken: process.env.NEXT_PUBLIC_QUICKBASE_USER_TOKEN || '',
      serverUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL || '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      setCredentials(data.realm, data.userToken);
      await connect(data.serverUrl, data.userToken);
      toast.success('Successfully connected to QuickBase');
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error('Failed to connect to QuickBase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect to QuickBase</CardTitle>
        <CardDescription>
          Enter your QuickBase credentials to connect through the MCP server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="realm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QuickBase Realm</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your-company.quickbase.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="userToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Enter your QuickBase user token" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MCP Server URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ws://localhost:3001" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}