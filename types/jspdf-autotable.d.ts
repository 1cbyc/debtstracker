declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number[];
      fontSize?: number;
    };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
    };
  }

  global {
    interface jsPDF {
      autoTable: (options: AutoTableOptions) => jsPDF;
      lastAutoTable?: {
        finalY: number;
      };
    }
  }
}
