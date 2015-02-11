#include<vector>

#include<CGAL/Exact_predicates_inexact_constructions_kernel.h>
#include<CGAL/Polygon_2.h>
#include<CGAL/create_offset_polygons_2.h>
#include <CGAL/create_straight_skeleton_from_polygon_with_holes_2.h>

#include "boost/date_time/posix_time/posix_time.hpp" 
#include<boost/shared_ptr.hpp>
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/foreach.hpp>

// typedef boost::posix_time::ptime Time;
// typedef boost::posix_time::time_duration TimeDuration;

using namespace std;
using boost::posix_time::ptime;
using boost::posix_time::time_duration;
using namespace boost::property_tree;


typedef CGAL::Exact_predicates_inexact_constructions_kernel K;
typedef K::Point_2 Point;
typedef CGAL::Polygon_2<K> Polygon;
typedef CGAL::Polygon_with_holes_2<K> PolygonWithHoles;
typedef CGAL::Straight_skeleton_2<K> Skeleton;
typedef boost::shared_ptr<Polygon> PolygonPtr;
typedef boost::shared_ptr<Skeleton> SkeletonPtr;
typedef vector<PolygonPtr> PolygonPtrVector;
typedef vector<Polygon> Polygons;



Polygon polygonFromArray(ptree array) {

    Polygon poly;
    BOOST_FOREACH( ptree::value_type const& point, array.get_child("")) {
        float x = point.second.get<float>("x");
        float y = point.second.get<float>("y");
        poly.push_back(Point(x, y));
        cout << "poly : " << x <<"," << y << "\n";

    }
    return poly;
}

int main()
{
  
    string input;
    getline(cin, input);

    Polygon outer;
    Polygons holes;
    float spacing = 1;
    
    try {
        stringstream json(input);
        ptree pt;
        boost::property_tree::read_json(json, pt);

        spacing = pt.get<float>("spacing");
        
        outer = polygonFromArray(pt.get_child("outer"));
        
        BOOST_FOREACH(ptree::value_type &array, pt.get_child("inner")) {

            Polygon hole = polygonFromArray(array.second);
            holes.push_back(hole);
        }

        // return EXIT_SUCCESS;
    }
    catch (exception const& e) {
        cout << e.what() << endl;
        return EXIT_FAILURE;
    }

    // ptime t1(boost::posix_time::microsec_clock::local_time());

  
    PolygonWithHoles shape(outer);

    for (Polygons::iterator it = holes.begin(); it != holes.end(); ++it) {
        shape.add_hole(*it);
    }
    
    SkeletonPtr skel = CGAL::create_interior_straight_skeleton_2(shape);

    // time_duration dt;
    // long msec;
    // ptime t2(boost::posix_time::microsec_clock::local_time());
    // dt = t2 - t1;
    // msec = dt.total_milliseconds();
    // cout << msec/1000.0 << endl; 

  
    PolygonPtrVector offset_polygons;
    // ptree contoursArray;
    stringstream ret;
    int i = 0;

    do {
      
        offset_polygons = CGAL::create_offset_polygons_2<Polygon>(spacing * i++, *skel);

        
        if (i > 50) {
            break;
        }

        for (PolygonPtrVector::iterator pi = offset_polygons.begin();
             pi != offset_polygons.end(); ++pi) {
            
            Polygon poly = **pi;
            ret << "[";
            
            for (Polygon::Vertex_const_iterator vi = poly.vertices_begin();
                 vi != poly.vertices_end(); ++vi) {
                
                Point p = *vi;
                ret << "[" << p.x() << "," << p.y() << "],";

                // ptree ptpoint, x, y;
                // x.put_value(((float)3.2));
                // y.put_value(p.y());

                // ptpoint.push_back(make_pair("x", x));
                // ptpoint.push_back(make_pair("y", y));

                // //create an array element with an empty first value
                // contoursArray.push_back(make_pair("", ptpoint));
            }
            ret << "],";
        }

        
    } while (offset_polygons.size() > 0);

    // ptime t3(boost::posix_time::microsec_clock::local_time());
    // dt = t3 - t2;
    // //number of elapsed miliseconds
    // msec = dt.total_milliseconds();
    // cout << msec/1000.0 << endl; 


    // ptree pt;
    // pt.add_child("contours", contoursArray);
    // stringstream output;
    // write_json(output, pt, false);
    
    cout << ret.str() << endl;
    return 1;
}
