import React, { useEffect, useRef } from 'react';
import { arrayOf, string, bool, number, object, shape } from 'prop-types';
import loadGoogleMapsApi from 'load-google-maps-api';
import defaultClasses from './map.css';
import escape from 'lodash.escape';

const getLocationFormattedAsHtml = location => {
    const name = location.name
        ? `<h3><b>${escape(location.name)}</b></h3>`
        : '';
    const comment = location.comment
        ? `<p>${escape(location.comment).replace(
              /(?:\r\n|\r|\n)/g,
              '<br>'
          )}</p>`
        : '';
    const phone = location.phone
        ? `<p>Phone: ${escape(location.phone)}</p>`
        : '';
    const address = location.address ? `${escape(location.address)}<br>` : '';
    const city = location.city ? escape(location.city) : '';
    const country = location.country ? escape(location.country) : '';
    const state = location.state ? escape(location.state) : '';
    const zipCode = location.zipcode ? escape(location.zipcode) : '';
    const cityComma =
        city.length && (zipCode.length || state.length) ? ', ' : '';
    const lineBreak = city.length || zipCode.length ? '<br>' : '';

    return `
    <div>
        ${name}
        ${comment}
        ${phone}
        <p><span>${address}${city}${cityComma}${zipCode}${lineBreak}${country}</span></p>
    </div>
`;
};

/**
 * Page Builder Map component.
 *
 * This component is part of the Page Builder / PWA integration. It can be consumed without Page Builder.
 *
 * @typedef Map
 * @kind functional component
 *
 * @param {props} props React component props
 *
 * @returns {React.Element} A React component that displays a Map.
 */
const Map = props => {
    const mapElement = useRef(null);

    const {
        apiKey,
        locations,
        height,
        mapOptions,
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        cssClasses = []
    } = props;

    const dynamicStyles = {
        height,
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
    };

    useEffect(() => {
        if (!locations.length) {
            return;
        }

        let googleMapsEvent;
        const mapOverlayInstances = [];

        const apiOptions = {
            key: apiKey,
            v: '3'
        };

        loadGoogleMapsApi(apiOptions)
            .then(googleMaps => {
                googleMapsEvent = googleMaps.event;

                const map = new googleMaps.Map(mapElement.current, mapOptions),
                    positions = [];

                let activeInfoWindow;

                locations.forEach(location => {
                    const position = new googleMaps.LatLng(
                        location.position.latitude,
                        location.position.longitude
                    );
                    positions.push(position);

                    const marker = new googleMaps.Marker({
                        map,
                        position,
                        title: location.name
                    });

                    const infoWindow = new googleMaps.InfoWindow({
                        content: getLocationFormattedAsHtml(location),
                        maxWidth: 350
                    });

                    marker.addListener('click', () => {
                        // close other open info window if present
                        if (activeInfoWindow) {
                            activeInfoWindow.close();
                        }

                        infoWindow.open(map, marker);
                        activeInfoWindow = infoWindow;
                    });

                    mapOverlayInstances.push(marker);
                    mapOverlayInstances.push(infoWindow);
                });

                // set the bounds of the map to the perimeter of the furthest locations in either direction
                if (positions.length > 1) {
                    const latitudeLongitudeBounds = new googleMaps.LatLngBounds();

                    positions.forEach(position => {
                        latitudeLongitudeBounds.extend(position);
                    });

                    map.fitBounds(latitudeLongitudeBounds);
                }

                // zoom to default zoom if there is only a single location
                if (positions.length === 1) {
                    map.setCenter(positions[0]);
                    map.setZoom(Map.defaultProps.mapOptions.zoom);
                }
            })
            .catch(error => console.error(error));

        return () => {
            if (!googleMapsEvent) {
                return;
            }

            mapOverlayInstances.forEach(mapOverlayInstance => {
                googleMapsEvent.clearInstanceListeners(mapOverlayInstance);
            });
        };
    }, [apiKey, locations, mapOptions]);

    return (
        <div
            ref={mapElement}
            style={dynamicStyles}
            className={[defaultClasses.root, ...cssClasses].join(' ')}
        />
    );
};

Map.propTypes = {
    apiKey: string,
    height: string,
    showControls: bool,
    mapOptions: shape({
        zoom: number,
        center: shape({
            lat: number,
            lng: number
        }),
        scrollwheel: bool,
        disableDoubleClickZoom: bool,
        disableDefaultUI: bool,
        mapTypeControl: bool,
        mapTypeControlStyle: shape({
            style: number
        })
    }),
    locations: arrayOf(
        shape({
            position: shape({
                latitude: number.isRequired,
                longitude: number.isRequired
            }),
            name: string,
            phone: string,
            address: string,
            city: string,
            state: string,
            zipcode: string,
            country: string,
            comment: string,
            styles: arrayOf(
                shape({
                    featureType: string,
                    elementType: string,
                    stylers: arrayOf(object)
                })
            )
        })
    ),
    textAlign: string,
    border: string,
    borderColor: string,
    borderWidth: string,
    borderRadius: string,
    marginTop: string,
    marginRight: string,
    marginBottom: string,
    marginLeft: string,
    paddingTop: string,
    paddingRight: string,
    paddingBottom: string,
    cssClasses: arrayOf(string)
};

Map.defaultProps = {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    locations: [],
    mapOptions: {
        zoom: 8,
        scrollwheel: false,
        disableDoubleClickZoom: false,
        disableDefaultUI: false,
        mapTypeControl: true
    }
};

export default Map;
