import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  imports: [RouterModule, HeaderComponent, FooterComponent, Sidebar],
  selector: 'sug-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss', './config/global.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected title = 'host';
}
