import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Video, Phone, User, Loader2, Trash2, CheckCircle, XCircle, FileText, Repeat, Bell, Send, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { NotificationStatusBadge } from '@/components/NotificationStatusBadge';

interface NotificationLog {
  id: string;
  notification_type: 'email' | 'sms' | 'whatsapp';
  status: string;
  recipient: string;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  error_message: string | null;
}

interface Appointment {
  id: string;
  doctor_name: string;
  doctor_specialty: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason: string;
  notes: string | null;
  status: string;
  location: string | null;
  appointment_type: string | null;
  reminder_enabled: boolean | null;
  reminder_sent: boolean | null;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  visit_notes: string | null;
  prescriptions: string | null;
  follow_up_actions: string | null;
  outcome: string | null;
  notification_type: string | null;
  reminder_minutes_before: number | null;
  user_phone: string | null;
}

const Appointments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<Record<string, NotificationLog[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [visitNotes, setVisitNotes] = useState({ visit_notes: '', prescriptions: '', follow_up_actions: '', outcome: '' });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Form state - pre-fill from navigation state if available
  const [formData, setFormData] = useState({
    doctor_name: location.state?.doctorName || '',
    doctor_specialty: location.state?.doctorSpecialty || '',
    appointment_date: new Date(),
    appointment_time: '09:00',
    duration_minutes: 30,
    reason: '',
    notes: '',
    location: '',
    appointment_type: 'in_person',
    reminder_enabled: true,
    recurrence_pattern: 'none',
    recurrence_end_date: null as Date | null,
    notification_type: 'email',
    reminder_minutes_before: 1440,
    user_phone: '',
  });

  // Open dialog if doctor info was passed from navigation
  useEffect(() => {
    if (location.state?.doctorName) {
      setDialogOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadNotificationLogs();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user!.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group logs by appointment_id
      const grouped: Record<string, NotificationLog[]> = {};
      (data || []).forEach((log: any) => {
        if (log.appointment_id) {
          if (!grouped[log.appointment_id]) {
            grouped[log.appointment_id] = [];
          }
          grouped[log.appointment_id].push(log);
        }
      });
      setNotificationLogs(grouped);
    } catch (error: any) {
      console.error('Error loading notification logs:', error);
    }
  };

  const addAppointment = async () => {
    if (!formData.doctor_name.trim() || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        user_id: user!.id,
        doctor_name: formData.doctor_name,
        doctor_specialty: formData.doctor_specialty || null,
        appointment_date: format(formData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: formData.appointment_time,
        duration_minutes: formData.duration_minutes,
        reason: formData.reason,
        notes: formData.notes || null,
        location: formData.location || null,
        appointment_type: formData.appointment_type,
        status: 'scheduled',
        reminder_enabled: formData.reminder_enabled,
        recurrence_pattern: formData.recurrence_pattern !== 'none' ? formData.recurrence_pattern : null,
        recurrence_end_date: formData.recurrence_end_date ? format(formData.recurrence_end_date, 'yyyy-MM-dd') : null,
        notification_type: formData.notification_type,
        reminder_minutes_before: formData.reminder_minutes_before,
        user_phone: formData.user_phone || null,
      };

      const { error, data } = await supabase.from('appointments').insert(appointmentData).select();

      if (error) throw error;

      // Create recurring appointments if pattern is set
      if (formData.recurrence_pattern !== 'none' && formData.recurrence_end_date && data) {
        await createRecurringAppointments(data[0], formData.recurrence_pattern, formData.recurrence_end_date);
      }

      toast.success('Appointment(s) scheduled successfully');
      setDialogOpen(false);
      resetForm();
      loadAppointments();
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      toast.error(error.message || 'Failed to schedule appointment');
    }
  };

  const createRecurringAppointments = async (baseAppointment: Appointment, pattern: string, endDate: Date) => {
    const appointments: any[] = [];
    let currentDate = new Date(baseAppointment.appointment_date);
    const end = new Date(endDate);

    while (currentDate < end) {
      // Calculate next occurrence based on pattern
      if (pattern === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (pattern === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pattern === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      if (currentDate < end) {
        appointments.push({
          ...baseAppointment,
          id: undefined,
          appointment_date: format(currentDate, 'yyyy-MM-dd'),
          parent_appointment_id: baseAppointment.id,
          created_at: undefined,
          updated_at: undefined,
        });
      }
    }

    if (appointments.length > 0) {
      const { error } = await supabase.from('appointments').insert(appointments);
      if (error) throw error;
    }
  };

  const saveVisitNotes = async () => {
    if (!selectedAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update(visitNotes)
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      toast.success('Visit notes saved successfully');
      setNotesDialogOpen(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Error saving visit notes:', error);
      toast.error('Failed to save visit notes');
    }
  };

  const openNotesDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setVisitNotes({
      visit_notes: appointment.visit_notes || '',
      prescriptions: appointment.prescriptions || '',
      follow_up_actions: appointment.follow_up_actions || '',
      outcome: appointment.outcome || '',
    });
    setNotesDialogOpen(true);
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Appointment deleted');
      loadAppointments();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Appointment marked as ${status}`);
      loadAppointments();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const testReminder = async (appointment: Appointment) => {
    try {
      toast.loading('Sending test reminder...', { id: 'test-reminder' });
      
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { testMode: true, appointmentId: appointment.id }
      });

      if (error) throw error;

      console.log('Test reminder result:', data);
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const messages: string[] = [];
        
        if (result.emailResult?.success) {
          messages.push('Email sent');
        } else if (result.emailResult?.error && result.emailResult.error !== 'Not attempted') {
          messages.push(`Email failed: ${result.emailResult.error}`);
        }
        
        if (result.smsResult?.success) {
          messages.push('SMS sent');
        } else if (result.smsResult?.error && result.smsResult.error !== 'Not attempted') {
          messages.push(`SMS failed: ${result.smsResult.error}`);
        }

        if (result.whatsappResult?.success) {
          messages.push('WhatsApp sent');
        } else if (result.whatsappResult?.error && result.whatsappResult.error !== 'Not attempted') {
          messages.push(`WhatsApp failed: ${result.whatsappResult.error}`);
        }
        
        if (result.success) {
          toast.success(messages.join(', ') || 'Reminder sent!', { id: 'test-reminder' });
        } else {
          toast.error(messages.join(', ') || 'Failed to send reminder', { id: 'test-reminder' });
        }

        // Reload notification logs after a short delay to show status
        setTimeout(() => loadNotificationLogs(), 1000);
      } else {
        toast.error(data.message || 'No results returned', { id: 'test-reminder' });
      }
    } catch (error: any) {
      console.error('Error sending test reminder:', error);
      toast.error(error.message || 'Failed to send test reminder', { id: 'test-reminder' });
    }
  };

  const resetForm = () => {
    setFormData({
      doctor_name: '',
      doctor_specialty: '',
      appointment_date: new Date(),
      appointment_time: '09:00',
      duration_minutes: 30,
      reason: '',
      notes: '',
      location: '',
      appointment_type: 'in_person',
      reminder_enabled: true,
      recurrence_pattern: 'none',
      recurrence_end_date: null,
      notification_type: 'email',
      reminder_minutes_before: 1440,
      user_phone: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAppointmentTypeIcon = (type: string | null) => {
    switch (type) {
      case 'in_person':
         return <MapPin className="w-4 h-4" />;
      case 'telehealth':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Helper function to safely compare appointment date/time with current time
  const isUpcomingAppointment = (apt: Appointment): boolean => {
    try {
      const now = new Date();
      // Get today's date at start of day for comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Parse appointment date (format: YYYY-MM-DD)
      const dateParts = apt.appointment_date.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dateParts[2], 10);
      const appointmentDate = new Date(year, month, day);
      
      // Debug logging
      console.log('Checking appointment:', {
        raw_date: apt.appointment_date,
        raw_time: apt.appointment_time,
        parsed_date: appointmentDate.toISOString(),
        today: today.toISOString(),
        now: now.toISOString(),
        doctor: apt.doctor_name,
        status: apt.status
      });
      
      // If appointment date is in the future, it's upcoming
      if (appointmentDate.getTime() > today.getTime()) {
        console.log('=> UPCOMING (future date)');
        return true;
      }
      
      // If appointment date is today, check the time
      if (appointmentDate.getTime() === today.getTime()) {
        // Parse appointment time (format: HH:MM or HH:MM:SS)
        const timeParts = apt.appointment_time.split(':');
        const appointmentHour = parseInt(timeParts[0], 10) || 0;
        const appointmentMinute = parseInt(timeParts[1], 10) || 0;
        
        console.log('Today appointment time check:', {
          appointmentHour,
          appointmentMinute,
          currentHour: now.getHours(),
          currentMinute: now.getMinutes()
        });
        
        // Compare with current time
        if (appointmentHour > now.getHours()) {
          console.log('=> UPCOMING (later today by hour)');
          return true;
        }
        if (appointmentHour === now.getHours() && appointmentMinute >= now.getMinutes()) {
          console.log('=> UPCOMING (later today by minute)');
          return true;
        }
      }
      
      console.log('=> PAST');
      return false;
    } catch (e) {
      console.error('Error parsing appointment date/time:', apt, e);
      return false;
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => isUpcomingAppointment(apt) && apt.status !== 'cancelled'
  );

  const pastAppointments = appointments.filter(
    (apt) => !isUpcomingAppointment(apt) || apt.status === 'cancelled'
  );

  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const getDayAppointments = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointmentsByDate[dateStr] || [];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your medical appointments and schedule
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical hover:opacity-90 shadow-medical">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Book a new medical appointment with your healthcare provider
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor_name">Doctor Name *</Label>
                  <Input
                    id="doctor_name"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor_specialty">Specialty</Label>
                  <Input
                    id="doctor_specialty"
                    value={formData.doctor_specialty}
                    onChange={(e) => setFormData({ ...formData, doctor_specialty: e.target.value })}
                    placeholder="Cardiology, Dentistry, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Appointment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.appointment_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.appointment_date ? format(formData.appointment_date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.appointment_date}
                        onSelect={(date) => date && setFormData({ ...formData, appointment_date: date })}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment_time">Time *</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={formData.duration_minutes.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment_type">Appointment Type</Label>
                  <Select
                    value={formData.appointment_type}
                    onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Annual checkup, follow-up, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="123 Medical Center Dr, Suite 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information or questions for the doctor..."
                  rows={3}
                />
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder">Enable Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified before your appointment</p>
                  </div>
                  <Switch
                    id="reminder"
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>

                {formData.reminder_enabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Notification Type</Label>
                        <Select
                          value={formData.notification_type}
                          onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">
                              <span className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Only
                              </span>
                            </SelectItem>
                            <SelectItem value="sms">
                              <span className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                SMS Only
                              </span>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <span className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp Only
                              </span>
                            </SelectItem>
                            <SelectItem value="all">
                              <span className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                All (Email, SMS & WhatsApp)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Remind Me Before</Label>
                        <Select
                          value={formData.reminder_minutes_before.toString()}
                          onValueChange={(value) => setFormData({ ...formData, reminder_minutes_before: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="360">6 hours</SelectItem>
                            <SelectItem value="720">12 hours</SelectItem>
                            <SelectItem value="1440">1 day</SelectItem>
                            <SelectItem value="2880">2 days</SelectItem>
                            <SelectItem value="4320">3 days</SelectItem>
                            <SelectItem value="10080">1 week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(formData.notification_type === 'sms' || formData.notification_type === 'whatsapp' || formData.notification_type === 'all') && (
                      <div className="space-y-2">
                        <Label htmlFor="user_phone">Phone Number for {formData.notification_type === 'sms' ? 'SMS' : formData.notification_type === 'whatsapp' ? 'WhatsApp' : 'SMS & WhatsApp'}</Label>
                        <Input
                          id="user_phone"
                          type="tel"
                          value={formData.user_phone}
                          onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +1 for US).
                          {(formData.notification_type === 'whatsapp' || formData.notification_type === 'all') && 
                            ' For WhatsApp, ensure the number is registered with WhatsApp.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurring Appointment</Label>
                <Select
                  value={formData.recurrence_pattern}
                  onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Recurrence</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recurrence_pattern !== 'none' && (
                <div className="space-y-2">
                  <Label>End Recurrence Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.recurrence_end_date && 'text-muted-foreground'
                        )}
                      >
                        <Repeat className="mr-2 h-4 w-4" />
                        {formData.recurrence_end_date ? format(formData.recurrence_end_date, 'PPP') : 'Pick end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.recurrence_end_date || undefined}
                        onSelect={(date) => date && setFormData({ ...formData, recurrence_end_date: date })}
                        disabled={(date) => date <= formData.appointment_date}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <Button onClick={addAppointment} className="w-full">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Visit Notes</DialogTitle>
              <DialogDescription>
                Record details about the visit, prescriptions, and follow-up actions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outcome">Visit Outcome</Label>
                <Select
                  value={visitNotes.outcome}
                  onValueChange={(value) => setVisitNotes({ ...visitNotes, outcome: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                    <SelectItem value="referred">Referred to Specialist</SelectItem>
                    <SelectItem value="tests_ordered">Tests Ordered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_notes">Visit Notes</Label>
                <Textarea
                  id="visit_notes"
                  value={visitNotes.visit_notes}
                  onChange={(e) => setVisitNotes({ ...visitNotes, visit_notes: e.target.value })}
                  placeholder="What happened during the visit..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescriptions">Prescriptions</Label>
                <Textarea
                  id="prescriptions"
                  value={visitNotes.prescriptions}
                  onChange={(e) => setVisitNotes({ ...visitNotes, prescriptions: e.target.value })}
                  placeholder="List any medications prescribed..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up">Follow-up Actions</Label>
                <Textarea
                  id="follow_up"
                  value={visitNotes.follow_up_actions}
                  onChange={(e) => setVisitNotes({ ...visitNotes, follow_up_actions: e.target.value })}
                  placeholder="Any follow-up appointments, tests, or actions needed..."
                  rows={3}
                />
              </div>

              <Button onClick={saveVisitNotes} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Save Visit Notes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={upcomingAppointments.length > 0 ? "upcoming" : "past"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{appointment.doctor_name}</h3>
                            {appointment.doctor_specialty && (
                              <Badge variant="outline">{appointment.doctor_specialty}</Badge>
                            )}
                            <Badge variant="outline" className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {appointment.appointment_time.substring(0, 5)} ({appointment.duration_minutes} min)
                              </span>
                            </div>
                            {appointment.location && (
                              <div className="flex items-center gap-2">
                                {getAppointmentTypeIcon(appointment.appointment_type)}
                                <span>{appointment.location}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-medium">Reason:</span> {appointment.reason}
                            </p>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Notes:</span> {appointment.notes}
                              </p>
                            )}
                          </div>

                          {/* Notification Status */}
                          {notificationLogs[appointment.id] && notificationLogs[appointment.id].length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Notification Status:</p>
                              <NotificationStatusBadge logs={notificationLogs[appointment.id]} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {appointment.reminder_enabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testReminder(appointment)}
                            className="text-primary"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Test Reminder
                          </Button>
                        )}
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAppointment(appointment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">No upcoming appointments</p>
              <p className="text-sm text-muted-foreground mt-1">Schedule a new appointment to get started</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{appointment.doctor_name}</h3>
                            {appointment.doctor_specialty && (
                              <Badge variant="outline">{appointment.doctor_specialty}</Badge>
                            )}
                            <Badge variant="outline" className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.appointment_time.substring(0, 5)}</span>
                            </div>
                          </div>

                          <p className="text-sm">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </p>

                          {appointment.visit_notes && (
                            <div className="pt-2 border-t text-sm space-y-1">
                              {appointment.outcome && <p><span className="font-medium">Outcome:</span> {appointment.outcome}</p>}
                              {appointment.visit_notes && <p><span className="font-medium">Notes:</span> {appointment.visit_notes}</p>}
                              {appointment.prescriptions && <p><span className="font-medium">Prescriptions:</span> {appointment.prescriptions}</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNotesDialog(appointment)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {appointment.visit_notes ? 'Edit' : 'Add'} Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAppointment(appointment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No past appointments</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Calendar</CardTitle>
              <CardDescription>View all your appointments in calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={calendarDate}
                    onMonthChange={setCalendarDate}
                    className="rounded-md border pointer-events-auto"
                    modifiers={{
                      hasAppointment: (date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return appointmentsByDate[dateStr]?.length > 0;
                      },
                    }}
                    modifiersStyles={{
                      hasAppointment: {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </div>

                <div className="flex-1">
                  {selectedDate && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      {getDayAppointments(selectedDate).length > 0 ? (
                        <div className="space-y-3">
                          {getDayAppointments(selectedDate).map((appointment) => (
                            <Card key={appointment.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {appointment.appointment_time.substring(0, 5)}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold">{appointment.doctor_name}</p>
                                      <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">No appointments on this day</p>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
