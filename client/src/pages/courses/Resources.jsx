import { useState, useRef } from 'react';
import { Book, FileText, FolderArchive, Search, Filter, UploadCloud, Download, Star, Eye, Tag, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const Resources = () => {
  const { user } = useSelector(state => state.auth);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Form Upload State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('material');
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const isLibrarianOrFaculty = user?.role === 'librarian' || user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';

  // Comprehensive Semester 1-8 Subject Depth Database
  const [libraries, setLibraries] = useState([
    // Sem 1 & 2 (First Year Core)
    { id: 101, title: 'Engineering Mathematics-I Notes', type: 'material', author: 'Prof. Ramanujan', year: 2023, tags: ['Sem-1', 'Math'], downloads: 1205, rating: 4.8, size: '12 MB', format: 'PDF' },
    { id: 102, title: 'Quantum Physics PYQ 2019-2022', type: 'pyq', author: 'Admin', year: 2022, tags: ['Sem-1', 'Physics', 'Exam'], downloads: 850, rating: 4.5, size: '5 MB', format: 'PDF' },
    { id: 201, title: 'Programming in C Fundamentals', type: 'ebook', author: 'Dennis Ritchie', year: 2020, tags: ['Sem-2', 'CS', 'C'], downloads: 3450, rating: 5.0, size: '18 MB', format: 'EPUB' },
    
    // Sem 3
    { id: 301, title: 'Advanced Data Structures', type: 'ebook', author: 'Cormen', year: 2022, tags: ['Sem-3', 'Algorithms', 'Core'], downloads: 345, rating: 4.8, size: '15 MB', format: 'PDF' },
    { id: 302, title: 'Digital Logic Design Circuits', type: 'material', author: 'Dr. Shannon', year: 2023, tags: ['Sem-3', 'Electronics', 'PPT'], downloads: 120, rating: 4.5, size: '5 MB', format: 'PPTX' },
    { id: 303, title: 'Object Oriented Programming in Java', type: 'material', author: 'Prof. Gosling', year: 2024, tags: ['Sem-3', 'Java', 'OOP'], downloads: 670, rating: 4.9, size: '2 MB', format: 'PDF' },
    
    // Sem 4
    { id: 401, title: 'Operating Systems Complete Notes', type: 'material', author: 'Prof. Hopper', year: 2023, tags: ['Sem-4', 'OS', 'PDF'], downloads: 550, rating: 4.7, size: '20 MB', format: 'PDF' },
    { id: 402, title: 'Database Management Systems (DBMS)', type: 'ebook', author: 'Navathe', year: 2021, tags: ['Sem-4', 'SQL', 'DBMS'], downloads: 1200, rating: 4.8, size: '30 MB', format: 'PDF' },
    { id: 403, title: 'Design & Analysis of Algorithms PYQ', type: 'pyq', author: 'Admin', year: 2023, tags: ['Sem-4', 'DAA', 'Exam'], downloads: 410, rating: 4.4, size: '4 MB', format: 'ZIP' },
    
    // Sem 5
    { id: 501, title: 'Computer Networks Layer Architecture', type: 'material', author: 'Dr. Cerf', year: 2025, tags: ['Sem-5', 'Networking', 'TCP/IP'], downloads: 220, rating: 4.6, size: '8 MB', format: 'PPTX' },
    { id: 502, title: 'Software Engineering Agile Model', type: 'material', author: 'Prof. Beck', year: 2023, tags: ['Sem-5', 'SE', 'SDLC'], downloads: 890, rating: 4.3, size: '3 MB', format: 'PDF' },
    { id: 503, title: 'Theory of Computation (Automata)', type: 'ebook', author: 'Hopcroft', year: 2019, tags: ['Sem-5', 'TOC', 'Math'], downloads: 400, rating: 4.5, size: '15 MB', format: 'EPUB' },
    
    // Sem 6
    { id: 601, title: 'Artificial Intelligence Search Algorithms', type: 'material', author: 'Dr. McCarthy', year: 2024, tags: ['Sem-6', 'AI', 'Search'], downloads: 1400, rating: 4.9, size: '22 MB', format: 'PDF' },
    { id: 602, title: 'Compiler Design Lexical Analysis', type: 'material', author: 'Prof. Aho', year: 2022, tags: ['Sem-6', 'Compilers', 'Parser'], downloads: 350, rating: 4.2, size: '6 MB', format: 'PDF' },
    { id: 603, title: 'Web Technologies Full Stack', type: 'ebook', author: 'Mozilla Docs', year: 2025, tags: ['Sem-6', 'Web', 'React'], downloads: 2050, rating: 5.0, size: '45 MB', format: 'PDF' },
    
    // Sem 7
    { id: 701, title: 'Machine Learning Neural Networks', type: 'material', author: 'Dr. Hinton', year: 2024, tags: ['Sem-7', 'ML', 'Deep Learning'], downloads: 3100, rating: 5.0, size: '55 MB', format: 'PPTX' },
    { id: 702, title: 'Cryptography & Network Security PYQ', type: 'pyq', author: 'Admin', year: 2023, tags: ['Sem-7', 'Security', 'Exam'], downloads: 600, rating: 4.6, size: '5 MB', format: 'ZIP' },
    { id: 703, title: 'Cloud Computing Infrastructure', type: 'material', author: 'AWS Academy', year: 2024, tags: ['Sem-7', 'Cloud', 'AWS'], downloads: 820, rating: 4.7, size: '14 MB', format: 'PDF' },
    
    // Sem 8
    { id: 801, title: 'Big Data Analytics Ecosystem', type: 'ebook', author: 'Hadoop Docs', year: 2023, tags: ['Sem-8', 'Big Data', 'Hadoop'], downloads: 540, rating: 4.4, size: '10 MB', format: 'PDF' },
    { id: 802, title: 'Internet of Things (IoT) Architecture', type: 'material', author: 'Dr. Ashton', year: 2025, tags: ['Sem-8', 'IoT', 'Sensors'], downloads: 410, rating: 4.8, size: '9 MB', format: 'PPTX' },
    { id: 803, title: 'Blockchain & Smart Contracts', type: 'material', author: 'Prof. Nakamoto', year: 2024, tags: ['Sem-8', 'Blockchain', 'Web3'], downloads: 700, rating: 4.9, size: '12 MB', format: 'PDF' }
  ]);

  const processedLib = libraries.filter(lib => {
    if (activeCategory !== 'all' && lib.type !== activeCategory) return false;
    if (search && !lib.title.toLowerCase().includes(search.toLowerCase()) && !lib.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0].name); };
  const handleChange = (e) => { e.preventDefault(); if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0].name); };

  // Handle Real-Time Upload Submission
  const submitUpload = (e) => {
    e.preventDefault();
    if(!uploadedFile || !newTitle) return;

    // Simulate backend object creation
    const newResource = {
      id: Date.now(),
      title: newTitle,
      type: newType,
      author: user?.name || 'Faculty Member',
      year: new Date().getFullYear(),
      tags: ['New', 'Uploaded'],
      downloads: 0,
      rating: 5.0,
      size: '2 MB',
      format: uploadedFile.split('.').pop().toUpperCase() || 'FILE'
    };

    // Update state to render instantly
    setLibraries([newResource, ...libraries]);

    // Cleanup & Close
    setNewTitle('');
    setUploadedFile(null);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50 dark:bg-[#0f172a] p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-7xl flex flex-col gap-8 lg:flex-row">
        
        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="glass p-6 rounded-3xl sticky top-8 border border-gray-100 dark:border-gray-800">
             <div className="mb-8">
               <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Digital Library</h1>
               <p className="text-sm font-medium text-gray-500">Access {libraries.length} premium academic resources instantly spanning Semesters 1 to 8.</p>
             </div>

             {isLibrarianOrFaculty && (
               <button onClick={() => setIsUploadModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition shadow-lg shadow-primary-500/30 mb-8">
                 <UploadCloud size={20} /> Upload Resource
               </button>
             )}

             <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block">Categories</label>
                {[
                  { id: 'all', icon: FolderArchive, label: 'All Resources' },
                  { id: 'ebook', icon: Book, label: 'eBooks Gateway' },
                  { id: 'material', icon: FileText, label: 'Study Materials' },
                  { id: 'pyq', icon: FileText, label: 'Past Year Papers' }
                ].map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeCategory === cat.id ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
                    <cat.icon size={18} /> {cat.label}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 space-y-6">
           <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
              <div className="w-full relative">
                 <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, author, or semester tag (e.g. 'Sem-4')..." className="w-full bg-transparent pl-12 pr-4 py-3 outline-none text-gray-900 dark:text-white font-medium" />
              </div>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition mr-2"><Filter size={20}/></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {processedLib.map((item, i) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 relative group flex flex-col">
                     
                     <div className="absolute top-6 right-6 flex gap-2">
                       <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                         item.type === 'ebook' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                         item.type === 'pyq' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                       }`}>{item.type}</span>
                     </div>

                     <div className="flex gap-4 items-start mb-4">
                        <div className={`p-4 rounded-2xl ${item.type === 'ebook' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                           {item.type === 'ebook' ? <Book size={32} /> : <FileText size={32} />}
                        </div>
                        <div className="pt-1 pr-16 bg-transparent">
                           <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-1">{item.title}</h3>
                           <p className="text-sm font-medium text-gray-500">{item.author} • {item.year}</p>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-2 mb-6">
                        {item.tags.map(tag => (
                          <span key={tag} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${tag.startsWith('Sem-') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-900/50' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}>
                             <Tag size={12}/> {tag}
                          </span>
                        ))}
                     </div>

                     <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                           <span className="flex items-center gap-1"><Download size={14}/> {item.downloads}</span>
                           <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor"/> {item.rating}</span>
                           <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{item.format} • {item.size}</span>
                        </div>
                        
                        <div className="flex gap-2">
                           <button className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition" title="Preview"><Eye size={18}/></button>
                           <button className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 rounded-lg transition" title="Download Resource"><Download size={18}/></button>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* --- UPLOAD DRAG-AND-DROP MODAL --- */}
      <AnimatePresence>
         {isUploadModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl z-10 border border-gray-200 dark:border-gray-800">
               <button type="button" onClick={() => setIsUploadModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
               
               <h2 className="text-2xl font-black dark:text-white mb-6">Upload Academy Resource</h2>
               
               {/* Native Drag and Drop Form Engine Container */}
               <form className="space-y-6" onSubmit={submitUpload} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">Resource Title</label>
                      <input type="text" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 font-medium" placeholder="e.g. OS Lecture 4" required />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">Resource Type</label>
                      <select value={newType} onChange={(e)=>setNewType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 font-medium cursor-pointer" required>
                         <option value="material">Study Material (Notes/PPT)</option>
                         <option value="ebook">eBook (PDF/EPUB)</option>
                         <option value="pyq">Previous Year Question</option>
                      </select>
                    </div>
                 </div>

                 {/* Native Dropzone Implementation */}
                 <div className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : uploadedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleChange} />
                    
                    {uploadedFile ? (
                      <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-3">
                           <CheckCircle size={32} />
                         </div>
                         <p className="font-bold text-emerald-600 dark:text-emerald-400">{uploadedFile}</p>
                         <button type="button" onClick={()=>setUploadedFile(null)} className="text-xs text-gray-500 mt-2 hover:underline">Remove file</button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={48} className={`mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                        <p className="text-lg font-bold text-gray-600 dark:text-gray-300 text-center px-4">Drag and drop your file here</p>
                        <p className="text-sm text-gray-500 mt-1 mb-4">PDF, PPTX, DOCX, ZIP up to 50MB</p>
                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-lg shadow-md hover:scale-105 transition-transform">Browse Files</button>
                      </>
                    )}
                 </div>

                 <button type="submit" disabled={!uploadedFile || !newTitle} className={`w-full py-4 rounded-xl font-black text-lg shadow-xl outline-none transition-all ${uploadedFile && newTitle ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30 focus:scale-[0.98]' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}>
                    Confirm Upload to Cloud
                 </button>
               </form>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

    </div>
  );
};
export default Resources;
