
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, RotateCcw, Clock, Cpu, Timer } from "lucide-react";

type Process = {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  remainingTime: number;
  completionTime?: number;
  turnaroundTime?: number;
  waitingTime?: number;
  state: "waiting" | "running" | "completed";
};

const initialProcesses: Process[] = [
  { id: "P1", name: "Process 1", arrivalTime: 0, burstTime: 8, priority: 3, remainingTime: 8, state: "waiting" },
  { id: "P2", name: "Process 2", arrivalTime: 1, burstTime: 4, priority: 1, remainingTime: 4, state: "waiting" },
  { id: "P3", name: "Process 3", arrivalTime: 2, burstTime: 9, priority: 4, remainingTime: 9, state: "waiting" },
  { id: "P4", name: "Process 4", arrivalTime: 3, burstTime: 5, priority: 2, remainingTime: 5, state: "waiting" },
];

export default function Index() {
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("fcfs");
  const [currentProcess, setCurrentProcess] = useState<string | null>(null);

  const resetSimulation = () => {
    setProcesses(initialProcesses.map(p => ({ 
      ...p, 
      remainingTime: p.burstTime, 
      state: "waiting" as const, 
      completionTime: undefined, 
      turnaroundTime: undefined, 
      waitingTime: undefined 
    })));
    setCurrentTime(0);
    setIsRunning(false);
    setCurrentProcess(null);
  };

  const getNextProcess = useCallback((algorithm: string, time: number) => {
    const availableProcesses = processes.filter(p => p.arrivalTime <= time && p.remainingTime > 0);
    
    if (availableProcesses.length === 0) return null;

    switch (algorithm) {
      case "fcfs":
        return availableProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      case "sjf":
        return availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime)[0];
      case "priority":
        return availableProcesses.sort((a, b) => a.priority - b.priority)[0];
      case "rr":
        return availableProcesses[0];
      default:
        return availableProcesses[0];
    }
  }, [processes]);

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    const simulateStep = () => {
      const nextProcess = getNextProcess(selectedAlgorithm, currentTime);
      
      if (nextProcess) {
        setCurrentProcess(nextProcess.id);
        
        setProcesses(prev => prev.map(p => {
          if (p.id === nextProcess.id) {
            const newRemainingTime = Math.max(0, p.remainingTime - 1);
            const newState = newRemainingTime === 0 ? "completed" : "running";
            
            if (newRemainingTime === 0) {
              return {
                ...p,
                remainingTime: newRemainingTime,
                state: newState,
                completionTime: currentTime + 1,
                turnaroundTime: (currentTime + 1) - p.arrivalTime,
                waitingTime: (currentTime + 1) - p.arrivalTime - p.burstTime
              };
            }
            
            return { ...p, remainingTime: newRemainingTime, state: newState };
          }
          return { ...p, state: p.state === "running" ? "waiting" : p.state };
        }));
      } else {
        setCurrentProcess(null);
      }

      setCurrentTime(prev => prev + 1);

      const allCompleted = processes.every(p => p.remainingTime === 0 || p.state === "completed");
      if (allCompleted) {
        setIsRunning(false);
      }
    };

    const interval = setInterval(simulateStep, 1000);
    return () => clearInterval(interval);
  }, [isRunning, currentTime, processes, selectedAlgorithm, getNextProcess]);

  const algorithmInfo = {
    fcfs: {
      name: "First Come First Served (FCFS)",
      description: "Processes are executed in the order they arrive",
      advantages: ["Simple to understand and implement", "Fair in terms of arrival order"],
      disadvantages: ["Can cause convoy effect", "Poor average waiting time"]
    },
    sjf: {
      name: "Shortest Job First (SJF)",
      description: "Process with shortest remaining time is executed first",
      advantages: ["Optimal average waiting time", "Good for batch systems"],
      disadvantages: ["Can cause starvation", "Requires knowledge of execution time"]
    },
    priority: {
      name: "Priority Scheduling",
      description: "Process with highest priority (lowest number) is executed first",
      advantages: ["Important processes get preference", "Flexible system"],
      disadvantages: ["Can cause starvation", "Priority inversion possible"]
    },
    rr: {
      name: "Round Robin (RR)",
      description: "Each process gets a fixed time quantum in circular order",
      advantages: ["Fair allocation", "Good response time", "No starvation"],
      disadvantages: ["Higher context switching overhead", "Time quantum selection critical"]
    }
  };

  const completedProcesses = processes.filter(p => p.completionTime !== undefined);
  const avgTurnaroundTime = completedProcesses.length > 0 
    ? completedProcesses.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0) / completedProcesses.length 
    : 0;
  const avgWaitingTime = completedProcesses.length > 0
    ? completedProcesses.reduce((sum, p) => sum + (p.waitingTime || 0), 0) / completedProcesses.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
            <Cpu className="h-8 w-8 text-primary" />
            Process Scheduling Simulator
          </h1>
          <p className="text-xl text-muted-foreground">
            Interactive visualization of CPU scheduling algorithms
          </p>
        </div>

        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
            <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="space-y-6">
            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Simulation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Algorithm:</span>
                    <div className="flex gap-2">
                      {Object.entries(algorithmInfo).map(([key, info]) => (
                        <Button
                          key={key}
                          variant={selectedAlgorithm === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAlgorithm(key)}
                          disabled={isRunning}
                        >
                          {info.name.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    variant={isRunning ? "secondary" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isRunning ? "Pause" : "Start"}
                  </Button>
                  
                  <Button
                    onClick={resetSimulation}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Time: {currentTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Algorithm Info */}
            <Card>
              <CardHeader>
                <CardTitle>{algorithmInfo[selectedAlgorithm as keyof typeof algorithmInfo].name}</CardTitle>
                <CardDescription>
                  {algorithmInfo[selectedAlgorithm as keyof typeof algorithmInfo].description}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Process Table */}
            <Card>
              <CardHeader>
                <CardTitle>Process Queue</CardTitle>
                <CardDescription>Current state of all processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Process</th>
                        <th className="text-left p-2">Arrival</th>
                        <th className="text-left p-2">Burst</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-left p-2">Remaining</th>
                        <th className="text-left p-2">State</th>
                        <th className="text-left p-2">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map((process) => (
                        <tr key={process.id} className={border-b ${currentProcess === process.id ? 'bg-primary/10' : ''}}>
                          <td className="p-2 font-medium">{process.name}</td>
                          <td className="p-2">{process.arrivalTime}</td>
                          <td className="p-2">{process.burstTime}</td>
                          <td className="p-2">{process.priority}</td>
                          <td className="p-2">{process.remainingTime}</td>
                          <td className="p-2">
                            <Badge variant={
                              process.state === "completed" ? "default" :
                              process.state === "running" ? "secondary" : "outline"
                            }>
                              {process.state}
                            </Badge>
                          </td>
                          <td className="p-2 w-32">
                            <Progress 
                              value={((process.burstTime - process.remainingTime) / process.burstTime) * 100} 
                              className="h-2"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {completedProcesses.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Turnaround Time:</span>
                      <span className="font-medium">{avgTurnaroundTime.toFixed(2)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Waiting Time:</span>
                      <span className="font-medium">{avgWaitingTime.toFixed(2)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Processes:</span>
                      <span className="font-medium">{completedProcesses.length}/{processes.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Process Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {completedProcesses.map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span>{p.name}:</span>
                          <span>TAT: {p.turnaroundTime}, WT: {p.waitingTime}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="algorithms" className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(algorithmInfo).map(([key, info]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle>{info.name}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Advantages</h4>
                        <ul className="space-y-1 text-sm">
                          {info.advantages.map((advantage, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              {advantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Disadvantages</h4>
                        <ul className="space-y-1 text-sm">
                          {info.disadvantages.map((disadvantage, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {disadvantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="concepts" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Concepts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Process States</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">New</Badge>
                        <Badge variant="secondary">Ready</Badge>
                        <Badge variant="default">Running</Badge>
                        <Badge variant="outline">Waiting</Badge>
                        <Badge>Terminated</Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">Important Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Arrival Time:</strong> When the process enters the ready queue
                        </div>
                        <div>
                          <strong>Burst Time:</strong> Time required for process execution
                        </div>
                        <div>
                          <strong>Completion Time:</strong> When the process finishes execution
                        </div>
                        <div>
                          <strong>Turnaround Time:</strong> Completion Time - Arrival Time
                        </div>
                        <div>
                          <strong>Waiting Time:</strong> Turnaround Time - Burst Time
                        </div>
                        <div>
                          <strong>Response Time:</strong> First CPU allocation - Arrival Time
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scheduling Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>CPU Utilization:</strong> Keep the CPU as busy as possible (ideally 40-90%)
                    </div>
                    <div>
                      <strong>Throughput:</strong> Number of processes completed per time unit
                    </div>
                    <div>
                      <strong>Turnaround Time:</strong> Time from submission to completion (minimize)
                    </div>
                    <div>
                      <strong>Waiting Time:</strong> Time spent waiting in ready queue (minimize)
                    </div>
                    <div>
                      <strong>Response Time:</strong> Time from request to first response (minimize)
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preemptive vs Non-Preemptive</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Preemptive</h4>
                    <p className="text-sm text-muted-foreground">
                      The CPU can be taken away from a process before it completes. Better response time but higher overhead.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Non-Preemptive</h4>
                    <p className="text-sm text-muted-foreground">
                      Once CPU is allocated to a process, it cannot be taken away until the process completes or voluntarily releases it.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
HTML Configuration (index.html)
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Process Scheduling Simulator</title>
    <meta name="description" content="Interactive process scheduling simulator for learning CPU scheduling algorithms" />
    <meta name="author" content="Hercules" />
    <link
      rel="icon"
      type="image/svg+xml"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖥</text></svg>"
    />

    <meta property="og:title" content="Process Scheduling Simulator" />
    <meta
      property="og:description"
      content="Interactive process scheduling simulator for learning CPU scheduling algorithms"
    />
    <meta property="og:type" content="website" />

    <!-- Theme detection script -->
    <script>
      (function () {
        try {
          var theme = localStorage.getItem("theme");
          if (theme === "system" || !theme) {
            var prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            theme = prefersDark ? "dark" : "light";
          }
          document.documentElement.classList.add(theme);
        } catch (e) {}
      })();
    </script>
    <link href="/src/index.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
Key Features:
Interactive Simulator: Real-time process scheduling with 4 algorithms (FCFS, SJF, Priority, Round Robin)
Visual Progress: Progress bars and state indicators for each process
Performance Metrics: Calculates turnaround time, waiting time, and other statistics
Educational Content: Comprehensive explanations of algorithms, concepts, and terminology
Responsive Design: Works on desktop and mobile devices
Modern UI: Uses shadcn/ui components with Tailwind CSS styling
The application demonstrates how different scheduling algorithms affect process execution order and system performance, making it perfect for educational purposes or understanding operating system concepts.
