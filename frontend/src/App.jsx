
import { useEffect, useRef, useState } from 'react'
import {
  fetchCars,
  fetchProduct,
  fetchProducts,
  getCachedProducts,
} from './api/products'
import './App.css'

function formatPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value

  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatId(value, width = 0) {
  const id = String(value).padStart(width, '0')
  return new Intl.NumberFormat('fa-IR', {
    useGrouping: false,
  }).format(Number(id))
}

function ProductCard({ product, onSelect }) {
  const imageUrl = product.image_url || ''

  return (
    <button
      className="product-card"
      onClick={() => onSelect(product)}
      type="button"
    >
      <span className="product-image-wrap">
        {imageUrl ? (
          <img
            className="product-image"
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <span className="product-image-fallback" aria-hidden="true">
            <span className="fallback-mark">
              کد / {formatId(product.id, 2)}
            </span>
            <span className="fallback-name">
              ارجان<br />اگزوز
            </span>
          </span>
        )}
        <span className="image-index">{formatId(product.id, 3)}</span>
      </span>

      <span className="product-info">
        <span className="product-name">{product.name}</span>
        <span className="product-card-bottom">
          <span className="product-price">
            <span className="eyebrow">قیمت</span>
            <strong>{formatPrice(product.price)}</strong>
          </span>
          <span className="product-link">
            مشاهده جزئیات <span aria-hidden="true">&#8598;</span>
          </span>
        </span>
      </span>
    </button>
  )
}

function ProductDialog({ product, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    let active = true

    document.body.classList.add('dialog-open')
    closeButtonRef.current?.focus()

    fetchProduct(product.id)
      .then((data) => {
        if (active) setDetail(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      active = false
      document.body.classList.remove('dialog-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [product.id, onClose])

  const images = detail?.images?.filter((image) => image.image_url) ?? []
  const cars = detail?.cars ?? []

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="product-dialog"
        role="dialog"
      >
        <div className="dialog-topline">
          <span className="eyebrow">
            جزئیات محصول / {formatId(product.id, 3)}
          </span>
          <button
            aria-label="بستن"
            className="close-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            بستن <span aria-hidden="true">&#215;</span>
          </button>
        </div>

        <div className="dialog-content">
          <div className="dialog-gallery">
            {images.length > 0 ? (
              images.map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                />
              ))
            ) : (
              <div className="dialog-image-fallback" aria-hidden="true">
                <span>ارجان<br />اگزوز</span>
              </div>
            )}
          </div>

          <div className="dialog-copy">
            <p className="eyebrow">ارجان اگزوز / کاتالوگ</p>
            <h2 id="dialog-title">{product.name}</h2>
            <p className="dialog-price">{formatPrice(product.price)}</p>

            {loading && (
              <p className="dialog-message">
                در حال دریافت اطلاعات محصول...
              </p>
            )}

            {error && (
              <p className="dialog-message error-message">{error}</p>
            )}

            {detail && (
              <>
                <div className="detail-section">
                  <h3>توضیحات</h3>
                  <p className="description">
                    {detail.description ||
                      'توضیحی برای این محصول ثبت نشده است.'}
                  </p>
                </div>

                <div className="detail-section fitment-section">
                  <h3>خودروهای سازگار</h3>
                  {cars.length > 0 ? (
                    <ul className="fitment-list">
                      {cars.map((car) => (
                        <li key={car.id}>
                          {car.name || `شناسه خودرو ${formatId(car.id)}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="description">
                      اطلاعاتی درباره خودروهای سازگار ثبت نشده است.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedCar, setSelectedCar] = useState(null)
  const [carsByBrand, setCarsByBrand] = useState({})
  const [loadingBrand, setLoadingBrand] = useState(null)
  const [carErrors, setCarErrors] = useState({})

  const brandFilters = [
    { id: 'all', label: 'همه برندها' },
    { id: 'saipa', label: 'سایپا' },
    { id: 'iran_khodro', label: 'ایرانخودرو' },
    { id: 'other', label: 'ماشین‌های دیگر' },
  ]

  const cars = selectedBrand
    ? carsByBrand[selectedBrand] ?? []
    : []

  const visibleProducts =
    selectedCar === null
      ? selectedBrand === null
        ? products
        : products.filter((product) =>
            (product.cars ?? []).some(
              (car) => car.brand === selectedBrand,
            ),
          )
      : products.filter((product) =>
          (product.cars ?? []).some(
            (car) => Number(car.id) === Number(selectedCar),
          ),
        )

  const loadBrandCars = (brand) => {
    if (
      carsByBrand[brand] !== undefined ||
      loadingBrand === brand
    ) {
      return
    }

    setLoadingBrand(brand)
    setCarErrors((current) => ({ ...current, [brand]: '' }))

    fetchCars(brand)
      .then((brandCars) => {
        setCarsByBrand((current) => ({
          ...current,
          [brand]: Array.isArray(brandCars) ? brandCars : [],
        }))
      })
      .catch((requestError) => {
        setCarErrors((current) => ({
          ...current,
          [brand]: requestError.message,
        }))
      })
      .finally(() => {
        setLoadingBrand((current) =>
          current === brand ? null : current,
        )
      })
  }

  const selectBrand = (brand) => {
    if (selectedBrand === brand) {
      setSelectedBrand(null)
      setSelectedCar(null)
      return
    }

    setSelectedBrand(brand)
    setSelectedCar(null)
    loadBrandCars(brand)
  }

  const selectCar = (car) => {
    setSelectedCar((current) =>
      Number(current) === Number(car.id) ? null : car.id,
    )
  }

  useEffect(() => {
    let active = true
    const cachedProducts = getCachedProducts()

    if (Array.isArray(cachedProducts)) {
      setProducts(cachedProducts)
      setLoading(false)
    }

    fetchProducts()
      .then((data) => {
        if (!active) return
        setProducts(Array.isArray(data) ? data : [])
        setError('')
      })
      .catch((requestError) => {
        if (active && !Array.isArray(cachedProducts)) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const retryCatalog = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  const selectedCarName =
    selectedCar === null
      ? null
      : cars.find(
          (car) => Number(car.id) === Number(selectedCar),
        )?.name

  const selectedBrandLabel =
    brandFilters.find((brand) => brand.id === selectedBrand)?.label

  const catalogTitle =
    selectedCarName || selectedBrandLabel || 'همه محصولات'

  return (
    <div className="store-layout">
      {sidebarOpen && (
        <button
          aria-label="بستن منو"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}

      <aside
        aria-label="منوی فروشگاه"
        className={`store-sidebar${sidebarOpen ? ' is-open' : ''}`}
        id="store-sidebar"
        inert={!sidebarOpen}
      >
        <div className="sidebar-head">
          <a
            aria-label="صفحه اصلی ارجان اگزوز"
            className="brand"
            href="#top"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="brand-mark">ا</span>
            <span className="brand-name">
              ارجان<span>اگزوز</span>
            </span>
          </a>

          <button
            aria-label="بستن منو"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <span aria-hidden="true">&#215;</span>
          </button>
        </div>

        <p className="sidebar-caption">قطعات تخصصی سیستم اگزوز</p>
        <div className="sidebar-rule" />

        <div className="sidebar-section-head">
          <div>
            <p className="sidebar-label">خودروها</p>
            <p className="sidebar-section-caption">
              دسته‌بندی بر اساس برند و خودرو
            </p>
          </div>
          <span className="sidebar-section-mark" aria-hidden="true">
            ۰۱
          </span>
        </div>

        <nav
          aria-label="دسته‌بندی محصولات بر اساس خودرو"
          className="sidebar-nav"
        >
          {brandFilters.map((filter, index) => {
            const isAll = filter.id === 'all'
            const isBrandSelected = selectedBrand === filter.id
            const isActive = isAll
              ? selectedBrand === null && selectedCar === null
              : isBrandSelected

            const brandCars = carsByBrand[filter.id] ?? []
            const brandLoading = loadingBrand === filter.id

            return (
              <div className="sidebar-group" key={filter.id}>
                <button
                  aria-current={isActive ? 'true' : undefined}
                  aria-expanded={!isAll && isBrandSelected}
                  aria-controls={
                    isAll ? undefined : `brand-cars-${filter.id}`
                  }
                  className={`sidebar-link${isActive ? ' is-selected' : ''}`}
                  onClick={() => {
                    if (isAll) {
                      setSelectedBrand(null)
                      setSelectedCar(null)
                    } else {
                      selectBrand(filter.id)
                    }
                  }}
                  type="button"
                >
                  <span className="sidebar-link-index">
                    {formatId(index + 1, 2)}
                  </span>
                  <span>{filter.label}</span>
                  {!isAll && (
                    <span
                      aria-hidden="true"
                      className={`sidebar-chevron${isBrandSelected ? ' is-open' : ''}`}
                    />
                  )}
                </button>

                {!isAll && isBrandSelected && (
                  <div
                    className="sidebar-car-list"
                    id={`brand-cars-${filter.id}`}
                  >
                    {brandLoading && (
                      <p className="sidebar-state sidebar-loading">
                        <span aria-hidden="true" />
                        در حال دریافت خودروها...
                      </p>
                    )}

                    {carErrors[filter.id] && (
                      <div className="sidebar-error" role="alert">
                        <p className="sidebar-state">
                          {carErrors[filter.id]}
                        </p>
                        <button
                          className="sidebar-retry"
                          onClick={() => {
                            setCarsByBrand((current) => {
                              const next = { ...current }
                              delete next[filter.id]
                              return next
                            })
                            setCarErrors((current) => ({
                              ...current,
                              [filter.id]: '',
                            }))
                            loadBrandCars(filter.id)
                          }}
                          type="button"
                        >
                          تلاش دوباره <span aria-hidden="true">&#8635;</span>
                        </button>
                      </div>
                    )}

                    {!carErrors[filter.id] &&
                      !brandLoading &&
                      brandCars.length === 0 && (
                        <p className="sidebar-state">
                          خودرویی برای این برند ثبت نشده است.
                        </p>
                      )}

                    {brandCars.map((car) => {
                      const isCarSelected =
                        Number(selectedCar) === Number(car.id)

                      return (
                        <button
                          key={car.id}
                          aria-pressed={isCarSelected}
                          className={`sidebar-car-link${isCarSelected ? ' is-selected' : ''}`}
                          onClick={() => selectCar(car)}
                          type="button"
                        >
                          <span>{car.name}</span>
                          {isCarSelected && (
                            <span
                              className="selected-car-mark"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <span className="sidebar-accent" />
          <span>ارجان اگزوز</span>
          <small>قطعات برای مسیر پیش رو</small>
        </div>
      </aside>

      <div className="store-main">
        <header className="content-header">
          <button
            aria-controls="store-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'بستن منو' : 'باز کردن منو'}
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <span className="menu-glyph" aria-hidden="true">
              <i /><i /><i />
            </span>
          </button>

          <div className="breadcrumbs">
            <span>فروشگاه</span>
            <span aria-hidden="true">/</span>
            <strong>کاتالوگ</strong>
          </div>

          <span className="header-caption">
            ارجان اگزوز / قطعات تخصصی
          </span>
        </header>

        <main className="catalog-page" id="top">
          <section
            aria-labelledby="page-title"
            className="catalog-intro-block"
          >
            <div>
              <p className="eyebrow">فروشگاه ارجان / سیستم اگزوز</p>
              <h1 id="page-title">قطعات سیستم اگزوز</h1>
              <p className="intro-description">
                محصولات موجود را ببینید و برای مشخصات و خودروهای سازگار،
                جزئیات هر محصول را باز کنید.
              </p>
            </div>

            <div className="catalog-status">
              <span className="status-dot" />
              <span>کاتالوگ محصولات</span>
            </div>
          </section>

          <section
            aria-labelledby="catalog-title"
            className="catalog-content"
            id="catalog"
          >
            <div className="catalog-toolbar">
              <h2 id="catalog-title">{catalogTitle}</h2>
              <span className="product-count" aria-live="polite">
                {loading
                  ? 'در حال بارگذاری'
                  : `${formatId(visibleProducts.length)} محصول`}
              </span>
            </div>

            {error ? (
              <div className="catalog-state" role="alert">
                <p className="eyebrow">خطا در ارتباط</p>
                <h3>دسترسی به کاتالوگ ممکن نیست.</h3>
                <p>{error}</p>
                <button
                  className="text-button"
                  onClick={retryCatalog}
                  type="button"
                >
                  تلاش دوباره <span aria-hidden="true">&#8592;</span>
                </button>
              </div>
            ) : loading ? (
              <div
                className="product-grid"
                aria-label="در حال بارگذاری محصولات"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <div className="product-skeleton" key={index} />
                ))}
              </div>
            ) : visibleProducts.length > 0 ? (
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    onSelect={setSelectedProduct}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="catalog-state empty-state">
                <p className="eyebrow">
                  {selectedCar !== null
                    ? 'محصولی برای این خودرو ثبت نشده'
                    : selectedBrand !== null
                      ? 'محصولی برای این برند ثبت نشده'
                      : 'هنوز محصولی ثبت نشده'}
                </p>
                <h3>
                  {selectedCar !== null
                    ? 'محصول سازگاری برای این خودرو پیدا نشد.'
                    : selectedBrand !== null
                      ? 'محصولی برای این برند پیدا نشد.'
                      : 'کاتالوگ در حال آماده‌سازی است.'}
                </h3>
                <p>
                  {selectedCar !== null || selectedBrand !== null
                    ? 'خودرو یا برند دیگری را انتخاب کنید یا همه محصولات را ببینید.'
                    : 'با ثبت محصولات جدید، آن‌ها را در همین‌جا خواهید دید.'}
                </p>
                {(selectedCar !== null || selectedBrand !== null) && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelectedCar(null)
                      setSelectedBrand(null)
                    }}
                    type="button"
                  >
                    نمایش همه محصولات
                  </button>
                )}
              </div>
            )}
          </section>

          <footer className="store-footer">
            <span>ارجان اگزوز</span>
            <span>فهرست قطعات سیستم اگزوز</span>
          </footer>
        </main>
      </div>

      {selectedProduct && (
        <ProductDialog
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  )
}

export default App
