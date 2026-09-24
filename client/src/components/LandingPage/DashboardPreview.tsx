'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  LayoutDashboard, 
  Bug, 
  FolderKanban, 
  Users,
  MessageSquare,
  Bell,
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield
} from "lucide-react";

interface Screen {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  screenshot?: string;
}

const screens: Screen[] = [
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    description: 'Overview of your projects, management, and team activity at a glance',
    icon: LayoutDashboard,
    screenshot: '/images/landing/adminDashboard.png',
  },
  {
    id: 'bugs',
    title: 'Bug Tracking',
    description: 'Full-featured bug management with priorities, statuses, and assignments',
    icon: Bug,
    screenshot: '/images/landing/bugs.png',
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Organize work with projects and features',
    icon: FolderKanban,
    screenshot: '/images/landing/projects.png',
  },
  {
    id: 'roles',
    title: 'Role Management',
    description: 'Define roles for Admin, Manager, Developer, and Tester with granular permissions',
    icon: Shield,
    screenshot: '/images/landing/roles.png',
  },
  {
    id: 'comments',
    title: 'Bug Discussions',
    description: 'Collaborate with your team through real-time comments on bugs',
    icon: MessageSquare,
    screenshot: '/images/landing/comments.png',
  },
  {
    id: 'notifications',
    title: 'Real-Time Notifications',
    description: 'Get instant updates via WebSockets when bugs are assigned or updated',
    icon: Bell,
    screenshot: '/images/landing/notifications.png',
  },
];

function MockDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Bugs', value: '24', color: 'bg-red-500' },
          { label: 'In Progress', value: '12', color: 'bg-amber-500' },
          { label: 'Resolved', value: '156', color: 'bg-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4 h-32 flex items-center justify-center border border-dashed border-slate-700">
        <div className="text-slate-500 text-sm text-center">
          <p className="mb-1">Dashboard Screenshot</p>
          <p className="text-xs">Add screenshot at public/images/landing/dashboard.png</p>
        </div>
      </div>
    </div>
  );
}

function MockBugs() {
  return (
    <div className="space-y-3">
      {[
        { title: 'Login page crashes on Safari', priority: 'High', status: 'Open', assignee: 'JD' },
        { title: 'API timeout on bulk operations', priority: 'Medium', status: 'In Progress', assignee: 'AK' },
        { title: 'Dashboard chart not loading', priority: 'Low', status: 'Resolved', assignee: 'MK' },
      ].map((bug, i) => (
        <div key={i} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-white text-sm">{bug.title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">{bug.priority}</span>
            <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">{bug.assignee}</span>
          </div>
        </div>
      ))}
      <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-dashed border-slate-700">
        <p className="text-slate-500 text-sm">Bugs List Screenshot</p>
        <p className="text-xs text-slate-600">Add at public/images/landing/bugs.png</p>
      </div>
    </div>
  );
}

function MockProjects() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Website Redesign', bugs: 45, progress: 75 },
        { name: 'Mobile App v2', bugs: 32, progress: 40 },
        { name: 'API Integration', bugs: 18, progress: 90 },
      ].map((project, i) => (
        <div key={i} className="bg-slate-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{project.name}</span>
            <span className="text-slate-400 text-sm">{project.bugs} bugs</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockRoles() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Admin', permissions: 'Full Access', users: 2 },
        { name: 'Manager', permissions: 'Manage Team & Bugs', users: 5 },
        { name: 'Developer', permissions: 'View & Update Bugs', users: 12 },
        { name: 'Tester', permissions: 'Report & View Bugs', users: 8 },
      ].map((role, i) => (
        <div key={i} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{role.name}</div>
            <div className="text-slate-400 text-xs">{role.permissions}</div>
          </div>
          <div className="text-primary font-semibold">{role.users}</div>
        </div>
      ))}
    </div>
  );
}

function MockComments() {
  return (
    <div className="space-y-3">
      {[
        { user: 'John D.', comment: 'I can reproduce this on Safari 15', time: '2h ago' },
        { user: 'Alice S.', comment: 'Assigned to me, looking into it now', time: '1h ago' },
        { user: 'Bob W.', comment: 'Fixed in latest commit, please verify', time: '30m ago' },
      ].map((comment, i) => (
        <div key={i} className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
              {comment.user.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-white text-sm font-medium">{comment.user}</span>
            <span className="text-slate-500 text-xs">{comment.time}</span>
          </div>
          <p className="text-slate-300 text-sm pl-8">{comment.comment}</p>
        </div>
      ))}
    </div>
  );
}

function MockNotifications() {
  return (
    <div className="space-y-3">
      {[
        { text: 'New bug assigned to you', icon: '🔴', time: 'Just now' },
        { text: 'Bug #123 marked as resolved', icon: '✅', time: '5m ago' },
        { text: 'John commented on your bug', icon: '💬', time: '1h ago' },
      ].map((notif, i) => (
        <div key={i} className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
          <span>{notif.icon}</span>
          <div className="flex-1">
            <div className="text-white text-sm">{notif.text}</div>
            <div className="text-slate-500 text-xs">{notif.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const mockContent: Record<string, React.ReactNode> = {
  dashboard: <MockDashboard />,
  bugs: <MockBugs />,
  projects: <MockProjects />,
  roles: <MockRoles />,
  comments: <MockComments />,
  notifications: <MockNotifications />,
};

export default function DashboardPreview() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  
  const currentScreen = screens[activeScreen];
  const CurrentIcon = currentScreen.icon;

  const nextScreen = () => {
    setActiveScreen((prev) => (prev + 1) % screens.length);
  };

  const prevScreen = () => {
    setActiveScreen((prev) => (prev - 1 + screens.length) % screens.length);
  };

  const handleImageError = () => {
    setImageError(prev => ({ ...prev, [currentScreen.id]: true }));
  };

  const showScreenshot = currentScreen.screenshot && !imageError[currentScreen.id];

  return (
    <section id="dashboard-preview" className="py-24 px-6 lg:px-12 bg-slate-50">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            See Tracora in <span className="text-primary">Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our intuitive interface designed for efficient bug tracking
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-1/3 space-y-2">
            {screens.map((screen, index) => (
              <motion.button
                key={screen.id}
                onClick={() => setActiveScreen(index)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activeScreen === index
                    ? 'bg-white shadow-md ring-2 ring-primary'
                    : 'bg-white/50 hover:bg-white hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeScreen === index ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <screen.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-semibold ${activeScreen === index ? 'text-primary' : 'text-slate-700'}`}>
                      {screen.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1">{screen.description}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="lg:w-2/3 flex-1">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700 rounded-md px-4 py-1 text-xs text-slate-400 flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    tracora.app/{currentScreen.id}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-900 min-h-[380px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CurrentIcon className="w-5 h-5 text-primary" />
                    {currentScreen.title}
                  </h3>
                  <div className="flex gap-1">
                    <button 
                      onClick={prevScreen}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={nextScreen}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScreen}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showScreenshot ? (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img 
                          src={currentScreen.screenshot}
                          alt={currentScreen.title}
                          className="w-full h-auto"
                          onError={handleImageError}
                        />
                      </div>
                    ) : (
                      mockContent[currentScreen.id]
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
            
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Click on the tabs above to explore different features • Add real screenshots to public/images/landing/
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
