import React, { useState, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Package, Home, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchHideoutStations } from '@/services/tarkovApi';
import { HideoutStation } from '@/types';

interface CollectorItem {
  name: string;
  order: number;
  img: string;
}

interface CollectorViewProps {
  collectorItems: CollectorItem[];
  completedCollectorItems: Set<string>;
  onToggleCollectorItem: (itemName: string) => void;
}

type GroupBy = 'collector' | 'hideout-stations';

export const CollectorView: React.FC<CollectorViewProps> = ({
  collectorItems,
  completedCollectorItems,
  onToggleCollectorItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('collector');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['collector']);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return collectorItems;
    const term = searchTerm.toLowerCase();
    return collectorItems.filter(item => 
      item.name.toLowerCase().includes(term)
    );
  }, [collectorItems, searchTerm]);

  const [hideoutStations, setHideoutStations] = useState<HideoutStation[]>([]);

  // Filter hideout stations based on search
  const filteredHideoutStations = useMemo(() => {
    if (!searchTerm.trim()) return hideoutStations;
    const term = searchTerm.toLowerCase();
    return hideoutStations.map(station => {
      // Check if station name matches
      const stationMatches = station.name.toLowerCase().includes(term);
      
      // Filter levels that have matching items
      const filteredLevels = station.levels.filter(level => {
        const hasMatchingItems = level.itemRequirements.some(req => 
          req.item.name.toLowerCase().includes(term)
        );
        const hasMatchingSkills = level.skillRequirements.some(req => 
          req.skill.name.toLowerCase().includes(term)
        );
        const hasMatchingStations = level.stationLevelRequirements.some(req => 
          req.station.name.toLowerCase().includes(term)
        );
        return hasMatchingItems || hasMatchingSkills || hasMatchingStations;
      });
      
      // Include station if name matches or if it has matching levels
      if (stationMatches || filteredLevels.length > 0) {
        return {
          ...station,
          levels: stationMatches ? station.levels : filteredLevels
        };
      }
      return null;
    }).filter(Boolean) as HideoutStation[];
  }, [hideoutStations, searchTerm]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Handle quantity changes for items
  const handleQuantityChange = (itemName: string, delta: number, maxQuantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemName]: Math.max(0, Math.min(maxQuantity, (prev[itemName] || 0) + delta))
    }));
  };

  // Check if an item is a currency (Roubles, Euros, Dollars)
  const isCurrencyItem = (itemName: string) => {
    return /(Roubles|Euros|Dollars)$/i.test(itemName);
  };

  // Fetch hideout stations data
  useEffect(() => {
    if (groupBy === 'hideout-stations') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await fetchHideoutStations();
          setHideoutStations(result.data.hideoutStations);
        } catch (err) {
          console.error('Failed to fetch hideout stations:', err);
          setError('Failed to load hideout stations. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [groupBy]);

  // Group items based on the current view mode
  const itemsByGroup = useMemo(() => {
    if (groupBy === 'collector') {
      return { 'Collector Items': filteredItems };
    } else if (groupBy === 'hideout-stations') {
      const stationsMap: Record<string, HideoutStation> = {};
      hideoutStations.forEach(station => {
        stationsMap[station.name] = station;
      });
      return stationsMap;
    }
    // Default to collector items if no group matches
    return { 'Collector Items': filteredItems };
  }, [filteredItems, groupBy, hideoutStations]);

  const sortedGroups = useMemo(
    () => Object.entries(itemsByGroup).sort(([a], [b]) => a.localeCompare(b)),
    [itemsByGroup]
  );

  const allGroupNames = useMemo(() => sortedGroups.map(([name]) => name), [sortedGroups]);
  const areAllExpanded = expandedGroups.length === allGroupNames.length;

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Toggle grouping */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setGroupBy('collector')}
          className={cn(
            'px-3 py-1 rounded flex items-center gap-2 text-sm',
            groupBy === 'collector' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Package className="h-4 w-4" />
          Collector Items
        </button>
        <button
          onClick={() => setGroupBy('hideout-stations')}
          className={cn(
            'px-3 py-1 rounded flex items-center gap-2 text-sm',
            groupBy === 'hideout-stations' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Home className="h-4 w-4" />
          Hideout Stations
        </button>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={groupBy === 'hideout-stations' ? "Search stations, items, skills..." : "Search items..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAll}
          className="flex items-center gap-2"
        >
          {areAllExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Loading and Error States */}
      {isLoading && groupBy === 'hideout-stations' && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && groupBy === 'hideout-stations' && (
        <div className="text-red-500 p-4 text-center bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Hideout Stations View */}
      {groupBy === 'hideout-stations' && !isLoading && !error && (
        <div className="space-y-6">
          {filteredHideoutStations.length === 0 && searchTerm.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              No stations or items found matching "{searchTerm}"
            </div>
          )}
          {filteredHideoutStations.map((station) => (
            <div key={station.name} className="border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted/50 p-4 font-medium flex justify-between items-center border-b">
                <div className="flex items-center gap-3">
                  {station.imageLink && (
                    <img
                      src={station.imageLink}
                      alt={station.name}
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="text-lg font-semibold">{station.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {station.levels.length} Level{station.levels.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {station.levels.map((level) => {
                  // Calculate completion for this level
                  const totalItems = level.itemRequirements.length;
                  const completedItems = level.itemRequirements.filter(req => 
                    completedCollectorItems.has(req.item.name)
                  ).length;
                  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                  return (
                    <div key={`${station.name}-${level.level}`} className="border rounded-lg p-4 space-y-4">
                      {/* Level Header with Progress */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base">Level {level.level}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {completedItems} / {totalItems}
                          </span>
                          <Progress value={progress} className="w-20 h-2" />
                        </div>
                      </div>

                      {/* Skill Requirements */}
                      {level.skillRequirements.length > 0 && (
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skill Requirements</h5>
                          <div className="space-y-1">
                            {level.skillRequirements.map((req, idx) => (
                              <div key={`skill-${station.name}-${level.level}-${idx}`} className="text-sm">
                                • {req.skill.name} Level {req.level}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Station Level Requirements */}
                      {level.stationLevelRequirements.length > 0 && (
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Station Requirements</h5>
                          <div className="space-y-1">
                            {level.stationLevelRequirements.map((req, idx) => (
                              <div key={`station-req-${station.name}-${level.level}-${idx}`} className="text-sm">
                                • {req.station.name} Level {req.level}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Item Requirements */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-muted-foreground">Required Items</h5>
                          {level.itemRequirements.map((req, idx) => {
                            const isCurrency = isCurrencyItem(req.item.name);
                            const currentQty = itemQuantities[req.item.name] || 0;
                            const isCompleted = completedCollectorItems.has(req.item.name) || (!isCurrency && currentQty >= req.count);
                            const progressText = isCurrency ? '' : `${currentQty}/${req.count}`;
                            
                            return (
                              <div 
                                key={`${station.name}-${level.level}-${idx}`} 
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors',
                                  isCompleted && 'opacity-75'
                                )}
                              >
                                <Checkbox
                                  id={`${station.name}-${level.level}-${req.item.name}`}
                                  checked={isCompleted}
                                  onCheckedChange={() => onToggleCollectorItem(req.item.name)}
                                  className="h-4 w-4 flex-shrink-0"
                                />
                                <label
                                  htmlFor={`${station.name}-${level.level}-${req.item.name}`}
                                  className={cn(
                                    'flex-1 flex items-center gap-2 cursor-pointer text-sm',
                                    isCompleted && 'line-through text-muted-foreground'
                                  )}
                                >
                                  {isCurrency ? (
                                    <span className="font-medium text-foreground/90">{req.count}x</span>
                                  ) : (
                                    <div className="flex items-center gap-1 bg-muted/30 rounded-md px-1 py-0.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(req.item.name, -1, req.count);
                                        }}
                                        className={cn(
                                          "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                          currentQty <= 0 && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={currentQty <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="w-12 text-center text-sm font-medium">{progressText}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(req.item.name, 1, req.count);
                                        }}
                                        className={cn(
                                          "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                          currentQty >= req.count && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={currentQty >= req.count}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  <span className="flex-1">{req.item.name}</span>
                                  {req.item.iconLink && (
                                    <img
                                      src={req.item.iconLink}
                                      alt={req.item.name}
                                      className="h-5 w-5 object-contain flex-shrink-0"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </label>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular Items View */}
      {groupBy !== 'hideout-stations' && (
        <Accordion
          type="multiple"
          className="w-full space-y-2"
          value={expandedGroups}
          onValueChange={setExpandedGroups}
        >
          {sortedGroups.map(([groupName, groupItems]) => {
            const completedCount = (groupItems as CollectorItem[]).filter(item => 
              completedCollectorItems.has(item.name)
            ).length;
            const totalCount = groupItems.length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <AccordionItem key={groupName} value={groupName} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg font-semibold">{groupName}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {completedCount} / {totalCount}
                      </span>
                      <Progress value={progress} className="w-24 h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {(groupItems as CollectorItem[]).map((item) => (
                      <div
                        key={item.name}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
                          completedCollectorItems.has(item.name) && 'opacity-60'
                        )}
                      >
                        <Checkbox
                          id={item.name}
                          checked={completedCollectorItems.has(item.name)}
                          onCheckedChange={() => onToggleCollectorItem(item.name)}
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={item.name}
                          className={cn(
                            'flex-1 flex items-center gap-2 cursor-pointer',
                            completedCollectorItems.has(item.name) && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.img && (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{item.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};
