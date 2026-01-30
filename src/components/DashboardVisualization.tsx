import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Database, Users, MapPin, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Dataset } from './DatasetCard';

interface DashboardVisualizationProps {
  datasets: Dataset[];
  onNavigate: (page: string) => void;
}

interface FilterState {
  modalities: string[];
  diagnoses: string[];
  sex: string[];
}

export function DashboardVisualization({ datasets, onNavigate }: DashboardVisualizationProps) {
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [filters, setFilters] = useState<FilterState>({
    modalities: [],
    diagnoses: [],
    sex: [],
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSubjects = datasets.reduce((sum, d) => sum + d.participantCount, 0);
    const countries = new Set(datasets.map(d => d.country)).size;
    // Mock users count (in a real app, this would come from backend)
    const users = Math.floor(totalSubjects * 1.5);
    
    return {
      studies: datasets.length,
      subjects: totalSubjects,
      users,
      countries,
    };
  }, [datasets]);

  // Prepare modality data
  const modalityData = useMemo(() => {
    const modalityCounts: { [key: string]: number } = {};
    datasets.forEach(dataset => {
      dataset.modality.forEach(mod => {
        modalityCounts[mod] = (modalityCounts[mod] || 0) + 1;
      });
    });
    return Object.entries(modalityCounts).map(([name, value]) => ({ name, value }));
  }, [datasets]);

  // Prepare diagnosis data
  const diagnosisData = useMemo(() => {
    const diagnosisCounts: { [key: string]: number } = {};
    datasets.forEach(dataset => {
      const diagnosis = dataset.diagnosis || 'Healthy Controls';
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });
    return Object.entries(diagnosisCounts).map(([name, value]) => ({ name, value }));
  }, [datasets]);

  // Mock sex distribution data (in real app, this would come from dataset metadata)
  const sexData = [
    { name: 'Male', value: 45 },
    { name: 'Female', value: 52 },
    { name: 'Any', value: 3 },
  ];

  // Colors matching AfNIA theme
  const COLORS = {
    primary: '#7A2DE3',
    accent: '#F7941D',
    purple1: '#9B51E0',
    purple2: '#6B21A8',
    orange1: '#FB923C',
    orange2: '#C2410C',
    blue: '#3B82F6',
    gray: '#6B7280',
  };

  const getColors = (count: number) => {
    const palette = [
      COLORS.primary,
      COLORS.accent,
      COLORS.purple1,
      COLORS.orange1,
      COLORS.blue,
      COLORS.purple2,
      COLORS.orange2,
      COLORS.gray,
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  };

  // Filter datasets based on current filters
  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => {
      if (filters.modalities.length > 0) {
        const hasModality = dataset.modality.some(m => filters.modalities.includes(m));
        if (!hasModality) return false;
      }
      if (filters.diagnoses.length > 0) {
        const diagnosis = dataset.diagnosis || 'Healthy Controls';
        if (!filters.diagnoses.includes(diagnosis)) return false;
      }
      // Sex filter would apply if we had per-dataset sex data
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
      diagnoses: [],
      sex: [],
    });
    setActiveChart(null);
    setActiveIndex(-1);
  };

  const hasActiveFilters = 
    filters.modalities.length > 0 || 
    filters.diagnoses.length > 0 || 
    filters.sex.length > 0;

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number, chartName: string) => {
    setActiveIndex(index);
    setActiveChart(chartName);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
    setActiveChart(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Statistics Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-1" style={{ color: '#7A2DE3', fontWeight: 700 }}>{stats.studies}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Studies</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1" style={{ color: '#F7941D', fontWeight: 700 }}>{stats.subjects.toLocaleString()}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1" style={{ color: '#7A2DE3', fontWeight: 700 }}>{stats.users.toLocaleString()}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1" style={{ color: '#F7941D', fontWeight: 700 }}>{stats.countries}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Countries</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-2xl mb-2" style={{ color: '#333', fontWeight: 600 }}>Featured Studies</h3>
          <p className="text-gray-600">Select criteria below to search studies</p>
        </div>

        {/* Interactive Charts */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Sex Chart */}
          <div className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#7A2DE3', fontWeight: 600 }}>SEX</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sexData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeChart === 'sex' ? activeIndex : -1}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => onPieEnter(_, index, 'sex')}
                  onMouseLeave={onPieLeave}
                  onClick={(data) => toggleFilter('sex', data.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {sexData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColors(sexData.length)[index]}
                      opacity={filters.sex.length === 0 || filters.sex.includes(entry.name) ? 1 : 0.3}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-sm" style={{ color: '#333', fontWeight: 500 }}>
                {filters.sex.length > 0 ? filters.sex.join(', ') : 'Any'}
              </div>
            </div>
          </div>

          {/* Modality Chart */}
          <div className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#F7941D', fontWeight: 600 }}>MODALITY</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={modalityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeChart === 'modality' ? activeIndex : -1}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => onPieEnter(_, index, 'modality')}
                  onMouseLeave={onPieLeave}
                  onClick={(data) => toggleFilter('modalities', data.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {modalityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColors(modalityData.length)[index]}
                      opacity={filters.modalities.length === 0 || filters.modalities.includes(entry.name) ? 1 : 0.3}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-sm" style={{ color: '#333', fontWeight: 500 }}>
                {filters.modalities.length > 0 ? filters.modalities.join(', ') : 'All'}
              </div>
            </div>
          </div>

          {/* Diagnosis/Study Group Chart */}
          <div className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#7A2DE3', fontWeight: 600 }}>STUDY GROUP</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={diagnosisData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeChart === 'diagnosis' ? activeIndex : -1}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => onPieEnter(_, index, 'diagnosis')}
                  onMouseLeave={onPieLeave}
                  onClick={(data) => toggleFilter('diagnoses', data.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {diagnosisData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColors(diagnosisData.length)[index]}
                      opacity={filters.diagnoses.length === 0 || filters.diagnoses.includes(entry.name) ? 1 : 0.3}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-sm" style={{ color: '#333', fontWeight: 500 }}>
                {filters.diagnoses.length > 0 ? filters.diagnoses.slice(0, 1).join(', ') : 'All'}
              </div>
            </div>
          </div>

          {/* Access Type Chart */}
          <div className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#F7941D', fontWeight: 600 }}>ACCESS TYPE</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Open', value: datasets.filter(d => d.accessType === 'Open').length },
                    { name: 'Restricted', value: datasets.filter(d => d.accessType === 'Restricted').length },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  style={{ cursor: 'pointer' }}
                >
                  <Cell fill={COLORS.primary} stroke="#fff" strokeWidth={2} />
                  <Cell fill={COLORS.accent} stroke="#fff" strokeWidth={2} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-sm" style={{ color: '#333', fontWeight: 500 }}>All</div>
            </div>
          </div>
        </div>

        {/* Filter Status Bar */}
        <div className="flex items-center justify-between mb-6 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700">
            Searching for studies that have{' '}
            <span className="px-3 py-1 rounded-full text-white mx-1" style={{ backgroundColor: hasActiveFilters ? '#F7941D' : '#7A2DE3', fontWeight: 500 }}>
              {hasActiveFilters ? 'Any' : 'All'}
            </span>{' '}
            checked criteria
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Reset Search
            </Button>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg mb-1" style={{ color: '#333', fontWeight: 600 }}>
                Results: <span style={{ color: '#7A2DE3' }}>{filteredDatasets.length} studies</span> • <span style={{ color: '#F7941D' }}>{filteredSubjects.toLocaleString()} subjects</span>
              </div>
              <div className="text-sm text-gray-600">Click on a study to view details</div>
            </div>
          </div>

          {filteredDatasets.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {filteredDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('explore')}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm mb-1" style={{ color: '#333', fontWeight: 500 }}>{dataset.title}</div>
                      <div className="text-xs text-gray-500">{dataset.institution} • {dataset.participantCount} subjects</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {dataset.modality.slice(0, 3).map((mod, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs rounded-full"
                        style={{ 
                          backgroundColor: idx % 2 === 0 ? '#7A2DE3' : '#F7941D',
                          color: 'white',
                          fontWeight: 500
                        }}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Database className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-lg mb-2" style={{ color: '#333', fontWeight: 500 }}>No studies found</div>
              <div className="text-gray-600 mb-4">
                {filteredDatasets.length} studies hidden by search criteria
              </div>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Reset search
              </Button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={() => onNavigate('explore')}
              className="w-full text-white"
              style={{ backgroundColor: '#7A2DE3' }}
              size="lg"
            >
              View All Datasets →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}