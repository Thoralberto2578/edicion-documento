/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DocumentEditor from './components/DocumentEditor';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <main className="min-h-screen">
      <DocumentEditor />
      <Toaster position="top-right" />
    </main>
  );
}
