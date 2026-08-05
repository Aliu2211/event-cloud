"use client";

import { useState } from "react";
import { Topbar } from "@/components/Topbar";

const TABS = [
  { id: "profile", label: "Organization Profile", icon: "business" },
  { id: "team", label: "Team Management", icon: "group_add" },
  { id: "api", label: "API & Integrations", icon: "terminal" },
  { id: "billing", label: "Billing & Subscription", icon: "payments" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <>
      <Topbar searchPlaceholder="Search settings, members, or keys..." />
      <div className="flex-1 overflow-y-auto p-6 md:px-8 md:py-6 custom-scrollbar">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Console Settings</h2>
            <p className="text-on-surface-variant text-sm">
              Manage your organization profile, cloud infrastructure sync, and team collaboration.
            </p>
          </div>
          <span className="text-xs text-on-surface-variant bg-surface-container-highest px-4 py-1 rounded">
            Last deployment: 12m ago
          </span>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <nav className="col-span-12 md:col-span-3 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? "w-full flex items-center justify-between p-4 rounded-lg text-left bg-surface-container-highest border-l-4 border-secondary shadow-sm"
                    : "w-full flex items-center justify-between p-4 rounded-lg text-left hover:bg-surface-container-low transition-colors"
                }
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`material-symbols-outlined ${activeTab === tab.id ? "text-secondary" : "text-on-surface-variant"}`}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className={`text-sm ${activeTab === tab.id ? "font-semibold text-primary" : "font-medium text-on-surface-variant"}`}
                  >
                    {tab.label}
                  </span>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
              </button>
            ))}
          </nav>

          <div className="col-span-12 md:col-span-9">
            {activeTab === "profile" && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="h-2 w-full bg-tertiary" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Identity & Presence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Organization Name</label>
                        <input
                          className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded px-4 py-2 text-sm"
                          type="text"
                          defaultValue="EventCloud Inc."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Contact Email</label>
                        <input
                          className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded px-4 py-2 text-sm"
                          type="email"
                          defaultValue="ops@eventcloud.io"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-lg p-6 bg-surface">
                      <div className="w-16 h-16 mb-4 rounded-full bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">domain</span>
                      </div>
                      <button className="text-tertiary text-sm hover:underline">Change Organization Logo</button>
                      <p className="text-[11px] text-on-surface-variant mt-2">SVG, PNG or JPG. Max 2MB.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button className="bg-tertiary text-on-tertiary px-8 py-4 rounded text-sm hover:shadow-lg transition-all">
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-primary">Active Collaborators</h3>
                  <button className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded text-xs">
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Invite Member
                  </button>
                </div>
                <div className="overflow-hidden border border-outline-variant rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container text-primary text-xs border-b border-outline-variant">
                      <tr>
                        <th className="p-4 font-semibold">Member</th>
                        <th className="p-4 font-semibold">Role</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      <tr>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                              JD
                            </div>
                            <div>
                              <p className="font-medium">Jane Doe</p>
                              <p className="text-xs text-on-surface-variant">jane.doe@eventcloud.io</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-4 py-0.5 bg-surface-container-highest text-primary text-[11px] font-bold rounded">
                            ADMIN
                          </span>
                        </td>
                        <td className="p-4 text-green-700 font-medium">Active</td>
                        <td className="p-4">
                          <button className="text-on-surface-variant hover:text-primary">
                            <span className="material-symbols-outlined">more_horiz</span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-xs">
                              SM
                            </div>
                            <div>
                              <p className="font-medium">Sam Miller</p>
                              <p className="text-xs text-on-surface-variant">sam@eventcloud.io</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-4 py-0.5 bg-surface-container-highest text-primary text-[11px] font-bold rounded">
                            DEVELOPER
                          </span>
                        </td>
                        <td className="p-4 text-green-700 font-medium">Active</td>
                        <td className="p-4">
                          <button className="text-on-surface-variant hover:text-primary">
                            <span className="material-symbols-outlined">more_horiz</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Cloud Infrastructure Sync</h3>
                <p className="text-on-surface-variant text-sm mb-6">
                  Configure AWS credentials and webhook destinations for DynamoDB and Lambda event synchronization.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-surface border border-outline-variant rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-secondary">key</span>
                        <span className="text-xs font-semibold uppercase">AWS Access Key</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                        MASKED
                      </span>
                    </div>
                    <code className="block bg-inverse-surface text-inverse-on-surface p-4 rounded font-mono text-xs">
                      AKIA************4H5K
                    </code>
                  </div>
                  <div className="p-4 bg-surface border border-outline-variant rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-tertiary">webhook</span>
                        <span className="text-xs font-semibold uppercase">API Gateway Webhook URL</span>
                      </div>
                      <span className="text-[11px] text-green-700 font-bold">CONNECTED</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded px-4 py-2 font-mono text-xs"
                        readOnly
                        type="text"
                        value="https://o4k9j2.execute-api.us-east-1.amazonaws.com/dev"
                      />
                      <button className="bg-surface-container-highest text-primary px-4 py-2 rounded border border-outline-variant hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-tertiary/5 border border-on-tertiary-container/20 rounded-lg flex gap-4">
                  <span className="material-symbols-outlined text-on-tertiary-container">info</span>
                  <p className="text-xs text-on-tertiary-container font-medium">
                    Rotation of AWS keys is recommended every 90 days. Next scheduled rotation is in 14 days.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-6">Subscription Plan</h3>
                  <div className="flex items-start justify-between border border-secondary/30 bg-secondary/5 rounded-xl p-6">
                    <div>
                      <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">Current Plan</p>
                      <h4 className="text-xl font-semibold text-primary">Enterprise Cloud</h4>
                      <p className="text-on-surface-variant text-sm mt-1">
                        Up to 50,000 monthly active attendees, unlimited events, and multi-region failover.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-semibold text-primary">
                        $499<span className="text-sm">/mo</span>
                      </p>
                      <p className="text-xs text-on-surface-variant">Next bill: Oct 12, 2026</p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-primary mb-4">Payment Method</h4>
                    <div className="flex items-center justify-between p-4 border border-outline-variant rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-surface-container border border-outline-variant rounded flex items-center justify-center font-bold text-[10px]">
                          VISA
                        </div>
                        <p className="text-sm text-primary">•••• •••• •••• 4242</p>
                      </div>
                      <button className="text-tertiary text-sm hover:underline">Edit</button>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-primary mb-4">Resource Usage</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span>Lambda Invocations</span>
                        <span>82%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: "82%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span>Storage (S3 / DynamoDB)</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary" style={{ width: "45%" }} />
                      </div>
                    </div>
                    <button className="w-full mt-8 py-4 border border-outline rounded text-sm hover:bg-surface-container-low transition-colors">
                      Download Invoices
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
