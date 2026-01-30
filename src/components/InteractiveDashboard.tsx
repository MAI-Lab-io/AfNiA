import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Database, Users, MapPin, FileText, X, ChevronRight, Download, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Dataset } from './DatasetCard';

interface InteractiveDashboardProps {
  datasets: Dataset[];
  onNavigate: (page: string) => void;
}

interface FilterState {
  modalities: string[];
  researchFocus: string[];
  studyDesign: string[];
  sex: string[];
  collectedData: string[];
}

type TabType = 'featured' | 'about' | 'utilization' | 'quickstart';

export function InteractiveDashboard({ datasets, onNavigate }: InteractiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [filters, setFilters] = useState<FilterState>({
    modalities: [],
    researchFocus: [],
    studyDesign: [],
    sex: [],
    collectedData: [],
  });
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // AfNIA color palette
  const COLORS = {
    primary: '#7A2DE3',
    accent: '#F7941D',
    purple1: '#9B51E0',
    purple2: '#6B21A8',
    orange1: '#FB923C',
    orange2: '#EA580C',
    blue: '#3B82F6',
    cyan: '#06B6D4',
    green: '#10B981',
    pink: '#EC4899',
    indigo: '#6366F1',
    red: '#EF4444',
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSubjects = datasets.reduce((sum, d) => sum + d.participantCount, 0);
    const uniqueCountries = [...new Set(datasets.map(d => d.country))];
    const countries = uniqueCountries.length;
    const users = Math.floor(totalSubjects * 1.5); // Mock users calculation
    
    return {
      studies: datasets.length,
      subjects: totalSubjects,
      users,
      countries,
    };
  }, [datasets]);

  // Extract all unique values for filters
  const filterOptions = useMemo(() => {
    const modalities = [...new Set(datasets.flatMap(d => d.modality))];
    const researchFocus = [...new Set(datasets.map(d => d.diagnosis || 'Healthy Controls'))];
    const studyDesigns = ['Longitudinal', 'Cross-sectional', 'Case-control', 'Registry'];
    const sexOptions = ['Male', 'Female'];
    const collectedDataTypes = ['Structural MRI', 'Functional MRI', 'PET', 'CT', 'DTI', 'Segmentation'];
    
    return {
      modalities: modalities.sort(),
      researchFocus: researchFocus.sort(),
      studyDesigns,
      sexOptions,
      collectedDataTypes,
    };
  }, [datasets]);

  // Prepare disease distribution data
  const diseaseData = useMemo(() => {
    const diseaseCounts: { [key: string]: number } = {};
    datasets.forEach(dataset => {
      const disease = dataset.diagnosis || 'Healthy Controls';
      diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
    });
    return Object.entries(diseaseCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [datasets]);

  const getChartColors = (count: number) => {
    const palette = [
      COLORS.primary,
      COLORS.accent,
      COLORS.blue,
      COLORS.green,
      COLORS.pink,
      COLORS.purple1,
      COLORS.orange1,
      COLORS.cyan,
      COLORS.indigo,
      COLORS.purple2,
      COLORS.orange2,
      COLORS.red,
    ];
    return palette.slice(0, count);
  };

  // Filter datasets based on current filters
  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => {
      // Modality filter
      if (filters.modalities.length > 0) {
        const hasModality = dataset.modality.some(m => filters.modalities.includes(m));
        if (!hasModality) return false;
      }
      
      // Research focus filter
      if (filters.researchFocus.length > 0) {
        const focus = dataset.diagnosis || 'Healthy Controls';
        if (!filters.researchFocus.includes(focus)) return false;
      }
      
      // Study design filter (using heuristic)
      if (filters.studyDesign.length > 0) {
        let design = 'Cross-sectional';
        if (dataset.title.toLowerCase().includes('progression') || 
            dataset.title.toLowerCase().includes('outcomes')) {
          design = 'Longitudinal';
        } else if (dataset.title.toLowerCase().includes('registry')) {
          design = 'Registry';
        } else if (dataset.diagnosis) {
          design = 'Case-control';
        }
        if (!filters.studyDesign.includes(design)) return false;
      }
      
      return true;
    });
  }, [datasets, filters]);

  const filteredSubjects = filteredDatasets.reduce((sum, d) => sum + d.participantCount, 0);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const isSelected = current.includes(value);
      return {
        ...prev,
        [category]: isSelected
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      modalities: [],
      researchFocus: [],
      studyDesign: [],
      sex: [],
      collectedData: [],
    });
  };

  const hasActiveFilters = 
    filters.modalities.length > 0 || 
    filters.researchFocus.length > 0 || 
    filters.studyDesign.length > 0 ||
    filters.sex.length > 0 ||
    filters.collectedData.length > 0;

  const activeFilterCount = 
    filters.modalities.length + 
    filters.researchFocus.length + 
    filters.studyDesign.length +
    filters.sex.length +
    filters.collectedData.length;

  // Mock usage statistics
  const usageStats = {
    thirtyDays: { uploads: 1234, downloads: 5678 },
    oneYear: { uploads: 15234, downloads: 67890 },
    allTime: { uploads: 45234, downloads: 189500 },
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white min-h-screen">
      {/* Top Navigation Tabs */}
      <div className="border-b border-gray-700" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('featured')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'featured'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-500'
              }`}
              style={{ color: activeTab === 'featured' ? COLORS.accent : '#9CA3AF' }}
            >
              Featured Studies
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-500'
              }`}
              style={{ color: activeTab === 'about' ? COLORS.accent : '#9CA3AF' }}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('utilization')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'utilization'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-500'
              }`}
              style={{ color: activeTab === 'utilization' ? COLORS.accent : '#9CA3AF' }}
            >
              Utilization
            </button>
            <button
              onClick={() => setActiveTab('quickstart')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'quickstart'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-500'
              }`}
              style={{ color: activeTab === 'quickstart' ? COLORS.accent : '#9CA3AF' }}
            >
              Quick Start
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'featured' && (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl mb-3">
                <span style={{ color: COLORS.accent }}>Welcome to AfNIA</span>
              </h1>
              <p className="text-gray-300 text-lg">
                The African NeuroImaging Archive (AfNIA) is a <span className="text-white">secure</span> online resource for{' '}
                <span className="text-white">archiving, exploring</span> and <span className="text-white">sharing</span> neuroscience data.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" style={{ color: COLORS.accent }} />
                <div>
                  <div className="text-3xl" style={{ color: COLORS.accent }}>{stats.studies}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">studies</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" style={{ color: COLORS.accent }} />
                <div>
                  <div className="text-3xl" style={{ color: COLORS.accent }}>{stats.users.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">users</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" style={{ color: COLORS.accent }} />
                <div>
                  <div className="text-3xl" style={{ color: COLORS.accent }}>{stats.subjects.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">subjects</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6" style={{ color: COLORS.accent }} />
                <div>
                  <div className="text-3xl" style={{ color: COLORS.accent }}>{stats.countries}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">countries</div>
                </div>
              </div>
            </div>

            {/* Featured Studies Section */}
            <div className="mb-8">
              <h2 className="text-2xl mb-4">Featured Studies</h2>
              <p className="text-gray-400 mb-6">Select criteria below to search studies</p>

              <div className="grid grid-cols-12 gap-6">
                {/* Left Sidebar - Filter Panel */}
                {showFilterPanel && (
                  <div className="col-span-3 space-y-6">
                    {/* Research Focus Filter */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: COLORS.accent }}>
                        Research Focus
                      </h3>
                      <div className="space-y-2">
                        {filterOptions.researchFocus.map(focus => (
                          <label key={focus} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.researchFocus.includes(focus)}
                              onChange={() => toggleFilter('researchFocus', focus)}
                              className="rounded"
                              style={{ accentColor: COLORS.accent }}
                            />
                            <span className="text-sm text-gray-300">{focus}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Study Design Filter */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: COLORS.accent }}>
                        Study Design
                      </h3>
                      <div className="space-y-2">
                        {filterOptions.studyDesigns.map(design => (
                          <label key={design} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.studyDesign.includes(design)}
                              onChange={() => toggleFilter('studyDesign', design)}
                              className="rounded"
                              style={{ accentColor: COLORS.accent }}
                            />
                            <span className="text-sm text-gray-300">{design}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sex Filter */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: COLORS.accent }}>
                        Sex
                      </h3>
                      <div className="space-y-2">
                        {filterOptions.sexOptions.map(sex => (
                          <label key={sex} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.sex.includes(sex)}
                              onChange={() => toggleFilter('sex', sex)}
                              className="rounded"
                              style={{ accentColor: COLORS.accent }}
                            />
                            <span className="text-sm text-gray-300">{sex}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Modality Filter */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: COLORS.accent }}>
                        Modality
                      </h3>
                      <div className="space-y-2">
                        {filterOptions.modalities.map(modality => (
                          <label key={modality} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.modalities.includes(modality)}
                              onChange={() => toggleFilter('modalities', modality)}
                              className="rounded"
                              style={{ accentColor: COLORS.accent }}
                            />
                            <span className="text-sm text-gray-300">{modality}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Collected Data Filter */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: COLORS.accent }}>
                        Collected Data
                      </h3>
                      <div className="space-y-2">
                        {filterOptions.collectedDataTypes.map(dataType => (
                          <label key={dataType} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.collectedData.includes(dataType)}
                              onChange={() => toggleFilter('collectedData', dataType)}
                              className="rounded"
                              style={{ accentColor: COLORS.accent }}
                            />
                            <span className="text-sm text-gray-300">{dataType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="w-full py-2 px-4 rounded-lg text-sm transition-colors"
                        style={{ 
                          backgroundColor: COLORS.accent,
                          color: 'white',
                        }}
                      >
                        Reset Search ({activeFilterCount})
                      </button>
                    )}
                  </div>
                )}

                {/* Main Content Area */}
                <div className={showFilterPanel ? 'col-span-6' : 'col-span-9'}>
                  {/* Disease Distribution Charts */}
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700 mb-6">
                    <h3 className="text-lg mb-4">Studies by Disease/Condition</h3>
                    
                    {/* Bar Chart */}
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={diseaseData}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis tick={{ fill: '#9CA3AF' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {diseaseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getChartColors(diseaseData.length)[index]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Chart */}
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={diseaseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: '#9CA3AF' }}
                          >
                            {diseaseData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getChartColors(diseaseData.length)[index]}
                                stroke="#1F2937"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-400 mb-2">
                        Searching for studies that have{' '}
                        <span className="text-white">
                          {activeFilterCount === 1 ? 'Any 1' : `All ${activeFilterCount}`}
                        </span>{' '}
                        checked criteria
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filters.researchFocus.map(item => (
                          <span 
                            key={item}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: COLORS.primary, color: 'white' }}
                          >
                            {item}
                          </span>
                        ))}
                        {filters.studyDesign.map(item => (
                          <span 
                            key={item}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: COLORS.accent, color: 'white' }}
                          >
                            {item}
                          </span>
                        ))}
                        {filters.modalities.map(item => (
                          <span 
                            key={item}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: COLORS.blue, color: 'white' }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar - Results Panel */}
                <div className="col-span-3">
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700 sticky top-6">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-400 mb-2">Results:</div>
                      <div className="text-3xl" style={{ color: COLORS.accent }}>
                        {filteredDatasets.length}
                      </div>
                      <div className="text-sm text-gray-400">studies • {filteredSubjects} subjects</div>
                    </div>

                    {hasActiveFilters ? (
                      <>
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <div className="text-sm text-gray-400 mb-3">
                            {filteredDatasets.length} studies match your criteria
                          </div>
                          <button
                            onClick={() => onNavigate('explore')}
                            className="w-full py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            style={{ 
                              backgroundColor: COLORS.primary,
                              color: 'white',
                            }}
                          >
                            View Results
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <div className="text-center text-gray-400 text-sm mb-4">
                          Select filters to search studies
                        </div>
                        <button
                          onClick={() => onNavigate('explore')}
                          className="w-full py-2 px-4 rounded-lg text-sm transition-colors"
                          style={{ 
                            backgroundColor: COLORS.primary,
                            color: 'white',
                          }}
                        >
                          Browse All Datasets
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics - Bottom Section */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <h2 className="text-2xl mb-6">Platform Utilization</h2>
              <div className="grid grid-cols-3 gap-6">
                {/* 30 Days */}
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Last 30 Days</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5" style={{ color: COLORS.green }} />
                        <span className="text-sm text-gray-400">Uploads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.green }}>
                        {usageStats.thirtyDays.uploads.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" style={{ color: COLORS.blue }} />
                        <span className="text-sm text-gray-400">Downloads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.blue }}>
                        {usageStats.thirtyDays.downloads.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1 Year */}
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Last Year</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5" style={{ color: COLORS.green }} />
                        <span className="text-sm text-gray-400">Uploads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.green }}>
                        {usageStats.oneYear.uploads.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" style={{ color: COLORS.blue }} />
                        <span className="text-sm text-gray-400">Downloads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.blue }}>
                        {usageStats.oneYear.downloads.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Time */}
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700" style={{ borderColor: COLORS.accent }}>
                  <div className="text-center mb-4">
                    <div className="text-sm uppercase tracking-wide mb-2" style={{ color: COLORS.accent }}>All Time</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5" style={{ color: COLORS.green }} />
                        <span className="text-sm text-gray-400">Uploads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.green }}>
                        {usageStats.allTime.uploads.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" style={{ color: COLORS.blue }} />
                        <span className="text-sm text-gray-400">Downloads</span>
                      </div>
                      <div className="text-2xl" style={{ color: COLORS.blue }}>
                        {usageStats.allTime.downloads.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl mb-6" style={{ color: COLORS.accent }}>About AfNIA</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                The African NeuroImaging Archive (AfNIA) is a comprehensive platform dedicated to aggregating and sharing brain imaging datasets from clinics and research centers across the African continent.
              </p>
              <p>
                Our mission is to advance neuroscience research in Africa by providing researchers, clinicians, and institutions with access to high-quality neuroimaging data while maintaining the highest standards of data security and participant privacy.
              </p>
              <h3 className="text-xl mt-6 mb-3" style={{ color: COLORS.accent }}>Key Features</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Secure data archiving and management</li>
                <li>Advanced search and filtering capabilities</li>
                <li>Multi-modal imaging support (MRI, PET, CT, fMRI, DTI)</li>
                <li>Collaborative research tools</li>
                <li>Standardized data formats and metadata</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'utilization' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl mb-6" style={{ color: COLORS.accent }}>Platform Utilization</h2>
            <div className="space-y-6">
              <p className="text-gray-300">
                AfNIA serves researchers and institutions across Africa, facilitating groundbreaking neuroimaging research through secure data sharing and collaboration.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg mb-4" style={{ color: COLORS.accent }}>Research Impact</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Published research articles: 45+
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Active collaborations: 23
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Countries represented: {stats.countries}
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg mb-4" style={{ color: COLORS.accent }}>Data Growth</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Total datasets: {stats.studies}
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Total subjects: {stats.subjects.toLocaleString()}
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: COLORS.accent }} />
                      Registered users: {stats.users.toLocaleString()}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quickstart' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl mb-6" style={{ color: COLORS.accent }}>Quick Start Guide</h2>
            <div className="space-y-6 text-gray-300">
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg mb-3" style={{ color: COLORS.accent }}>For Researchers</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Browse available datasets using the search filters</li>
                  <li>Request access to datasets of interest</li>
                  <li>Download data after approval</li>
                  <li>Cite AfNIA in your publications</li>
                </ol>
              </div>

              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg mb-3" style={{ color: COLORS.accent }}>For Data Contributors</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Prepare your dataset according to our guidelines</li>
                  <li>Complete the data contribution form</li>
                  <li>Upload your data securely</li>
                  <li>Collaborate with the AfNIA community</li>
                </ol>
              </div>

              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg mb-3" style={{ color: COLORS.accent }}>Need Help?</h3>
                <p>Contact us at: <a href="mailto:support@afnia.mailab.io" className="underline" style={{ color: COLORS.accent }}>support@afnia.mailab.io</a></p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => onNavigate('explore')}
                  className="py-3 px-6 rounded-lg transition-colors"
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                >
                  Browse Datasets
                </button>
                <button
                  onClick={() => onNavigate('contribute')}
                  className="py-3 px-6 rounded-lg transition-colors border"
                  style={{ borderColor: COLORS.accent, color: COLORS.accent }}
                >
                  Contribute Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
