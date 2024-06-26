import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {AiGeneratedImage} from "./interfaces/ai-generated-image";
import {BehaviorSubject, map, Observable, tap} from "rxjs";
import {GalleryImage} from "./interfaces/gallery-image";

@Injectable({
  providedIn: 'root'
})
export class ImagesService {
  private readonly apiUrl = 'http://localhost:80';
  private galleryImagesSubject = new BehaviorSubject<GalleryImage[]>([]);
  private paginationDataSubject = new BehaviorSubject<{ page: number, total: number }>({page: 1, total: 0});
  public galleryImages$ = this.galleryImagesSubject.asObservable();
  public paginationData$ = this.paginationDataSubject.asObservable();
  public searchQuery: { [key: string]: string | string[] } = {};

  constructor(private http: HttpClient) {
  }

  private fetchImages(params: { [key: string]: any }): Observable<{
    page: number,
    total: number,
    images: AiGeneratedImage[]
  }> {
    const httpParams = new HttpParams({fromObject: params});
    return this.http.get<{
      page: number,
      total: number,
      images: AiGeneratedImage[]
    }>(`${this.apiUrl}/content/images`, {params: httpParams})
      .pipe(
        tap(data => {
          this.galleryImagesSubject.next(this.convertToGalleryImages(data.images));
          this.paginationDataSubject.next({page: data.page, total: data.total});
        }),
      );
  }

  searchImages(query: { [key: string]: string | string[] }, limit: number = 100): Observable<any> {
    this.searchQuery = {...query, page: '1', limit: limit.toString()};
    return this.fetchImages(this.searchQuery);
  }

  getNewPage(page: number, limit: number = 100): Observable<any> {
    const queryParams = {...this.searchQuery, page: page.toString(), limit};
    return this.fetchImages(queryParams);
  }

  getImage(id: string): Observable<AiGeneratedImage> {
    return this.http.get<AiGeneratedImage>(`${this.apiUrl}/content/images/${id}`);
  }

  getImageUrl(image: AiGeneratedImage) {
    return `${this.apiUrl}/content/storage/images/${image.storageKey}`;
  }

  getImagesByAuthor(authorId: string | null, page: number, limit: number = 100): Observable<{
    images: GalleryImage[],
    page: number,
    total: number
  }> {
    this.searchQuery = {
      authorId: authorId || '',
      page: page.toString(),
      limit: limit.toString()
    };
    return this.fetchImages(this.searchQuery).pipe(
      map(
        response => {
          return {
            images: this.convertToGalleryImages(response.images),
            page: response.page,
            total: response.total
          }
        }
      )
    );
  }

  private convertToGalleryImages(images: AiGeneratedImage[]): GalleryImage[] {
    const storageUrl = `${this.apiUrl}/content/storage`;
    return images.map(image => ({
      id: image._id,
      prompt: image.prompt,
      author: image.author?.name,
      storageUrl: `${storageUrl}/images/${image.storageKey}`,
      thumbnailUrl: `${storageUrl}/thumbnails/${image.thumbnailKey}`
    }));
  }

  uploadImage(value: { model: string, prompt: string, negativePrompt: string, technicalTags: string[], image: File }) {
    const formData = new FormData();
    formData.append('model', value.model);
    formData.append('prompt', value.prompt);
    if (value.negativePrompt)
      formData.append('negativePrompt', value.negativePrompt);
    if (value.technicalTags.length > 0)
      value.technicalTags.forEach(tag => formData.append('technicalTags', tag));
    formData.append('image', value.image, value.image.name);
    return this.http.post(`${this.apiUrl}/content/images`, formData);
  }
}
