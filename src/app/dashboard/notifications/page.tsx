'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useNotifications } from '../../../../lib/hooks/useNotifications';
import { useMaterials } from '../../../../lib/hooks/useMaterials';

interface Notification {
  id: string;
  type: string;
  materialId?: string;
  materialTitle?: string;
  sharedBy?: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notifications, isLoading, mutate } = useNotifications();
  const { materials } = useMaterials();
  const materialsCount = materials.length;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      // Optimistically update the cache
      if (response.ok) {
        mutate((current: Notification[]) => {
          if (!current) return current;
          return current.map((n) => 
            n.id === notificationId ? { ...n, read: true } : n
          );
        }, false); // Don't revalidate immediately
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n: Notification) => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((n: Notification) => markAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.materialId) {
      router.push(`/dashboard/materials`);
      // Scroll to material after navigation
      setTimeout(() => {
        const materialElement = document.querySelector(`[data-material-id="${notification.materialId}"]`);
        if (materialElement) {
          materialElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar materialsCount={materialsCount} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar materialsCount={materialsCount} />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-700 hover:text-gray-900 font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">🔔</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">No notifications</h2>
                <p className="text-sm text-gray-600">
                  You'll see notifications here when someone shares materials with you
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                      notification.read
                        ? 'border-gray-200'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'material_shared' ? (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">📚</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🔔</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1 ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.message}
                            </p>
                            {notification.materialTitle && (
                              <p className="text-xs text-gray-600 mb-2">
                                Material: <span className="font-semibold">{notification.materialTitle}</span>
                              </p>
                            )}
                            {notification.sharedBy && (
                              <p className="text-xs text-gray-500">
                                Shared by: <span className="font-medium">{notification.sharedBy.name || notification.sharedBy.email}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                            )}
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-gray-700 hover:text-gray-900 font-semibold px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

