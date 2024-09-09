import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import * as WEBIFC from 'web-ifc';

import * as OBC from '@thatopen/components';
import Stats from 'stats.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;

  private components = new OBC.Components();
  private worlds = this.components.get(OBC.Worlds);
  private world!: OBC.SimpleWorld<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBC.SimpleRenderer
  >;
  private fragmentIfcLoader!: OBC.IfcLoader;
  private stats = new Stats();

  constructor() {}

  async ngAfterViewInit() {
    console.log(Object.keys(WEBIFC));
    this.world = this.worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();
    this.fragmentIfcLoader = this.components.get(OBC.IfcLoader);

    this.components.init();
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.renderer = new OBC.SimpleRenderer(
      this.components,
      this.containerRef.nativeElement
    );
    this.world.camera = new OBC.SimpleCamera(this.components);

    this.world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
    this.world.scene.setup();
    this.fragmentIfcLoader.settings.wasm = {
      path: 'https://unpkg.com/web-ifc@0.0.57/',
      absolute: true,
    };

    const grids = this.components.get(OBC.Grids);
    grids.create(this.world);

    // this.world.scene.three.background = null;

    this.fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

    // Add stats
    document.body.appendChild(this.stats.dom);
    await this.loadIfc();
    await this.animate();
  }

  private async loadIfc() {
    try {
      const documentoUrl = 'assets/revit.ifc';
      const file = await fetch(documentoUrl);
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await this.fragmentIfcLoader.load(buffer);
      console.log('model', model);
      model.name = 'example';
      if (this.world.scene.three) {
        this.world.scene.three.add(model);
      }
    } catch (error) {
      console.error('Error loading IFC file:', error);
    }
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    // Update stats
    this.stats.begin();
    // monitored code here
    this.stats.end();

    // Render the scene
    if (this.world.renderer && this.world.camera) {
      const renderer = this.world.renderer as any; // Type assertion to access render method if available
      if (renderer instanceof THREE.WebGLRenderer) {
        renderer.render(this.world.scene.three, this.world.camera.three);
      }
    }
  }
}
