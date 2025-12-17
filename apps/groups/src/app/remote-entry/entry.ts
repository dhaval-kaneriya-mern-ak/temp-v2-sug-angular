import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-groups-entry',
  template: `
    <div class="groups-container">
      <h1>Groups Application</h1>
      <p>Welcome to the Groups remote application!</p>
      <div class="dummy-content">
        <p>This is some dummy content for the groups module.</p>
        <ul>
          <li>Group 1</li>
          <li>Group 2</li>
          <li>Group 3</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .groups-container {
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        margin: 20px;
      }
      h1 {
        color: #333;
      }
    `,
  ],
})
export class RemoteEntry {}
