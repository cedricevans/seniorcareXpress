import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';

const MessagesPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ recipient_id: '', content: '' });
  const [sending, setSending] = useState(false);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.created) - new Date(a.created));
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await pb.collection('messages').getFullList({
        filter: `sender_id="${currentUser.id}" || recipient_id="${currentUser.id}"`,
        expand: 'sender_id,recipient_id',
        $autoCancel: false,
      });
      setMessages(res);
    } catch (err) {
      console.error('Failed to load messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await pb.collection('users').getFullList({ sort: 'name', $autoCancel: false });
      setUsers(res.filter((u) => u.id !== currentUser.id));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadMessages();
    loadUsers();
  }, [currentUser]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!form.recipient_id || !form.content.trim()) {
      toast.error('Select a recipient and enter a message');
      return;
    }
    setSending(true);
    try {
      await pb.collection('messages').create({
        sender_id: currentUser.id,
        recipient_id: form.recipient_id,
        content: form.content.trim(),
        read: false,
      }, { $autoCancel: false });
      toast.success('Message sent');
      setForm({ recipient_id: '', content: '' });
      loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (message) => {
    if (message.read || message.recipient_id !== currentUser.id) return;
    try {
      await pb.collection('messages').update(message.id, { read: true }, { $autoCancel: false });
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, read: true } : m)));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Messages | SeniorCare Xpress</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Stay connected with your care team.</p>
        </div>
        <Button variant="outline" onClick={loadMessages}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Inbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No messages yet.</div>
            ) : (
              <div className="space-y-3">
                {sortedMessages.map((message) => {
                  const isSender = message.sender_id === currentUser.id;
                  const sender = message.expand?.sender_id;
                  const recipient = message.expand?.recipient_id;
                  return (
                    <button
                      key={message.id}
                      onClick={() => markAsRead(message)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        message.read || isSender ? 'bg-white' : 'bg-primary/5 border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {isSender ? `To ${recipient?.name || recipient?.email || 'User'}` : sender?.name || sender?.email || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(message.created).toLocaleString()}</p>
                          </div>
                        </div>
                        {!isSender && !message.read && (
                          <Badge className="bg-secondary text-secondary-foreground">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{message.content}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-secondary" /> New Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Select value={form.recipient_id} onValueChange={(val) => setForm((prev) => ({ ...prev, recipient_id: val }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your message..."
                  rows={5}
                  className="bg-white"
                />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;
