'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, MoveRight } from 'lucide-react';
import type { Book, UserBook, BookStatus } from '@/lib/db';

interface BookCardProps {
  book: Book;
  userBook: UserBook;
  onMove: (bookId: string, newStatus: BookStatus) => void;
  onDelete: (bookId: string) => void;
}

export function BookCard({ book, userBook, onMove, onDelete }: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  const statusLabels: Record<BookStatus, string> = {
    want_to_read: 'Want to Read',
    currently_reading: 'Currently Reading',
    finished: 'Finished',
  };

  const otherStatuses: BookStatus[] = (['want_to_read', 'currently_reading', 'finished'] as BookStatus[])
    .filter((s) => s !== userBook.status);

  return (
    <Card className="flex-shrink-0 w-[200px] hover:shadow-lg transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="relative group">
          {book.cover_url && !imageError ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-[260px] object-cover rounded"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-[260px] bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground text-center px-2">
                {book.title}
              </span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {otherStatuses.map((status) => (
                <DropdownMenuItem key={status} onClick={() => onMove(userBook.id, status)}>
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move to {statusLabels[status]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => onDelete(userBook.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{book.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        </div>

        {userBook.status === 'currently_reading' && userBook.progress_percent > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{userBook.progress_percent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${userBook.progress_percent}%` }}
              />
            </div>
          </div>
        )}

        {userBook.ai_analytics && (
          <div className="flex flex-wrap gap-1">
            {(userBook.ai_analytics as any).moods?.slice(0, 2).map((mood: string) => (
              <Badge key={mood} variant="secondary" className="text-xs">
                {mood}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
