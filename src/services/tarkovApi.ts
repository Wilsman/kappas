import { TaskData, CollectorItemsData } from '../types';

const TARKOV_API_URL = 'https://api.tarkov.dev/graphql';

interface CombinedApiData {
  data: {
    tasks: TaskData['data']['tasks'];
    task: CollectorItemsData['data']['task'];
  };
  errors?: { message: string }[];
}

const COMBINED_QUERY = `
{
  tasks(lang: en) {
    id
    minPlayerLevel
    kappaRequired
    lightkeeperRequired
    map {
      name
    }
    taskRequirements {
      task {
        id
        name
      }
    }
    trader {
      name
    }
    wikiLink
    name
  }
  task(id: "5c51aac186f77432ea65c552") {
    objectives {
      ... on TaskObjectiveItem {
        items {
          id
          name
          iconLink
        }
      }
    }
  }
}
`;

export async function fetchCombinedData(): Promise<{ tasks: TaskData; collectorItems: CollectorItemsData }> {
  const response = await fetch(TARKOV_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: COMBINED_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: CombinedApiData = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  // Transform the combined result into separate TaskData and CollectorItemsData
  const tasks: TaskData = {
    data: {
      tasks: result.data.tasks
    }
  };

  const collectorItems: CollectorItemsData = {
    data: {
      task: result.data.task
    }
  };

  return { tasks, collectorItems };
}
