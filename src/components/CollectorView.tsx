import React, { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

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

type GroupBy = 'collector' | 'hideout';

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

  // Group items
  const itemsByGroup = useMemo(() => {
    if (groupBy === 'collector') {
      return { 'Collector Items': filteredItems };
    }
    // For now, hideout items will be empty - can be expanded later
    return { 'Hideout Items': [] };
  }, [filteredItems, groupBy]);

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
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setGroupBy('collector')}
          className={cn(
            'px-3 py-1 rounded flex items-center gap-2',
            groupBy === 'collector' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Package className="h-4 w-4" />
          Collector Items
        </button>
        <button
          onClick={() => setGroupBy('hideout')}
          className={cn(
            'px-3 py-1 rounded flex items-center gap-2',
            groupBy === 'hideout' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Package className="h-4 w-4" />
          Hideout Items
        </button>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search items..."
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

      {/* Groups */}
      <Accordion
        type="multiple"
        className="w-full space-y-2"
        value={expandedGroups}
        onValueChange={setExpandedGroups}
      >
        {sortedGroups.map(([groupName, groupItems]) => {
          const completedCount = groupItems.filter((item: CollectorItem) => completedCollectorItems.has(item.name)).length;
          const totalCount = groupItems.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <AccordionItem key={groupName} value={groupName} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
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
              <AccordionContent className="px-4 pb-4 border-t">
                {groupItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No items available yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupItems
                      .sort((a: CollectorItem, b: CollectorItem) => a.order - b.order)
                      .map((item: CollectorItem) => {
                        const isCompleted = completedCollectorItems.has(item.name);
                        return (
                          <div
                            key={item.name}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-md border transition-colors hover:bg-muted cursor-pointer",
                              isCompleted && "bg-muted/50"
                            )}
                            onClick={() => onToggleCollectorItem(item.name)}
                          >
                            <Checkbox
                              id={`collector-${item.name}`}
                              checked={isCompleted}
                              onCheckedChange={() => onToggleCollectorItem(item.name)}
                            />
                            <img 
                              src={item.img} 
                              alt={item.name}
                              className="w-8 h-8 object-contain flex-shrink-0"
                              loading="lazy"
                            />
                            <label
                              htmlFor={`collector-${item.name}`}
                              className={cn(
                                "flex-1 text-sm cursor-pointer",
                                isCompleted && "text-muted-foreground line-through"
                              )}
                            >
                              {item.name}
                            </label>
                          </div>
                        );
                      })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
