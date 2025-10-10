import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Workflow } from '../models/workflow.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private readonly mockWorkflows: Workflow[] = [
    {
      id: '1',
      name: '3D surface displacement caused by the 2016 Japan M7 Kumamoto earthquake',
      description: 'Analysis of three dimensional surface displacement caused by the 2016 Japan M7 Kumamoto earthquake by comparing two datasets from OpenTopography - Pre (doi: 10.5069/G9XP7303)- and post (doi: 10.5069/G9SX6B9T) - Kumamoto earthquake rupture lidar scans. The 3D surface deformation produced by the earthquake was calculated using windowed implementation of the iterative closest point (ICP) algorithm available via GitHub compiled on Ubuntu 18.04.4 LTS',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(),
      contributor: 'viswanat@sdsc.edu',
      oscData: [
        {
          name: 'Pre-Kumamoto Earthquake Rupture (16 April 2016)',
          description: 'The 16 April 2016 M7 Kumamoto earthquake ruptured the Futagawa- Hinagu fault zone on Kyushu Island of southwestern Japan. The lidar dataset collected by Air Survey Co., Ltd., of Japan covers the western half of the rupture zone. The acquisition of the imagery closely brackets the timing of the earthquake: The pre-earthquake dataset was acquired on 15 April 2016 and the post-earthquake dataset was acquired on 23 April 2016.',
          link: '#'
        },
        {
          name: 'Post-Kumamoto Earthquake Rupture (16 April 2016)',
          description: 'The 16 April 2016 M7 Kumamoto earthquake ruptured the Futagawa- Hinagu fault zone on Kyushu Island of southwestern Japan. The lidar dataset collected by Air Survey Co., Ltd., of Japan covers the western half of the rupture zone. The acquisition of the imagery closely brackets the timing of the earthquake: The pre-earthquake dataset was acquired on 15 April 2016 and the post-earthquake dataset was acquired on 23 April 2016.',
          link: '#'
        }
      ],
      githubRepositories: [
        {
          title: 'https://github.com/symao/libicp',
          description: 'C++ Library for Iterative Closest Point fitting. http://www.cvlibs.net/software/libicp/ . Fix some mistake in point-to-plane icp implementation. Add a robust threshold to improve the precision.',
          gitHash: '5b9784ed08f63fa607e6e84624f8e0f34b929324',
          contents: [
            { filename: 'CMakeLists.txt', hash: '798f302a743932b610ff943300e40019bde5abe4' },
            { filename: 'README.TXT', hash: 'b7e5f346792fcb586294532d655b13182c8202d5' },
            { filename: 'src', hash: '0fcb9ab716feacb5cb71845b1c081aef30dd2f6b' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Name Workflow 2',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 86400000),
      contributor: 'researcher@example.edu',
      oscData: [
        {
          name: 'Sample Dataset 1',
          description: 'This is a sample dataset for testing purposes.',
          link: '#'
        }
      ],
      githubRepositories: [
        {
          title: 'https://github.com/example/sample-repo',
          description: 'Sample repository for demonstration.',
          gitHash: 'abc123def456789',
          contents: [
            { filename: 'main.py', hash: 'hash123456' },
            { filename: 'README.md', hash: 'hash789012' }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Name Workflow 3',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 172800000),
      contributor: 'scientist@university.edu',
      oscData: [],
      githubRepositories: []
    },
    {
      id: '4',
      name: 'Name Workflow 1',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(),
      contributor: 'user@domain.com'
    },
    {
      id: '5',
      name: 'Name Workflow 2',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 86400000),
      contributor: 'admin@test.edu'
    },
    {
      id: '6',
      name: 'Name Workflow 3',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 172800000),
      contributor: 'developer@sample.org'
    }
  ];

  constructor() { }

  getWorkflows(): Observable<Workflow[]> {
    // Simula una llamada al backend
    return of(this.mockWorkflows);
  }

  getWorkflow(id: string): Observable<Workflow | undefined> {
    const workflow = this.mockWorkflows.find(w => w.id === id);
    return of(workflow);
  }
}
