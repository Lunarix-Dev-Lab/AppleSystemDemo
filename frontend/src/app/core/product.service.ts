import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product, ProductCreate, ProductImage, ProductUpdate } from './product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/products';

  list(activeOnly = true): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.BASE}?active_only=${activeOnly}`);
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.BASE}/${id}`);
  }

  create(data: ProductCreate): Observable<Product> {
    return this.http.post<Product>(this.BASE, data);
  }

  update(id: number, data: ProductUpdate): Observable<Product> {
    return this.http.put<Product>(`${this.BASE}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  uploadImage(productId: number, file: File): Observable<ProductImage> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ProductImage>(`${this.BASE}/${productId}/images`, body);
  }

  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${productId}/images/${imageId}`);
  }

  reorderImages(productId: number, imageIds: number[]): Observable<unknown> {
    return this.http.put(`${this.BASE}/${productId}/images/reorder`, { image_ids: imageIds });
  }
}
