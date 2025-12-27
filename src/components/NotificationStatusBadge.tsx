import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Clock, AlertCircle, Send, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

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

interface NotificationStatusBadgeProps {
  logs: NotificationLog[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'queued':
      return <Clock className="w-3 h-3" />;
    case 'sent':
      return <Send className="w-3 h-3" />;
    case 'delivered':
      return <Check className="w-3 h-3" />;
    case 'read':
      return <CheckCheck className="w-3 h-3" />;
    case 'failed':
    case 'undelivered':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'queued':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'read':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'failed':
    case 'undelivered':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'sms':
      return 'SMS';
    case 'email':
      return 'Email';
    default:
      return type;
  }
};

const formatTime = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), 'MMM d, h:mm a');
  } catch {
    return null;
  }
};

export const NotificationStatusBadge = ({ logs }: NotificationStatusBadgeProps) => {
  if (!logs || logs.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 mt-2">
        {logs.map((log) => (
          <Tooltip key={log.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1 cursor-help ${getStatusColor(log.status)}`}
              >
                {getStatusIcon(log.status)}
                <span>{getTypeLabel(log.notification_type)}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <p className="font-medium">{getTypeLabel(log.notification_type)} Status: {log.status}</p>
                <p className="text-muted-foreground">To: {log.recipient}</p>
                {log.sent_at && (
                  <p className="text-muted-foreground">Sent: {formatTime(log.sent_at)}</p>
                )}
                {log.delivered_at && (
                  <p className="text-green-600">Delivered: {formatTime(log.delivered_at)}</p>
                )}
                {log.read_at && (
                  <p className="text-emerald-600">Read: {formatTime(log.read_at)}</p>
                )}
                {log.error_message && (
                  <p className="text-red-600">Error: {log.error_message}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};